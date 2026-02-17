import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchGroup, leaveGroup as leaveGroupAction, deleteGroupAction } from "../features/groups/groupSlice";
import {
  fetchMessages,
  sendMessage as sendMessageAction,
  setCurrentGroup,
  addMessage,
  updateMessage,
  removeMessage
} from "../features/chat/chatSlice";
import { getSocket, joinGroup, leaveGroup as leaveGroupSocket } from "../socket/socket";
import { uploadFile, getFiles, downloadFile, deleteFile as deleteFileService } from "../services/fileService";
import ProtectedRoute from "../components/ProtectedRoute";

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("chat");
  const [messageInput, setMessageInput] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { currentGroup, isLoading: groupLoading, error: groupError } = useSelector((state) => state.groups);
  const { messages, isLoading } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const [groupFiles, setGroupFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const response = await getFiles(groupId);
      setGroupFiles(response.data.files);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    dispatch(setCurrentGroup(groupId));
    dispatch(fetchGroup(groupId));
    dispatch(fetchMessages({ groupId, page: 1, limit: 50 }));
    loadFiles();

    const socket = getSocket();
    if (socket) {
      joinGroup(groupId);

      const handleNewMessage = (data) => {
        dispatch(addMessage({ groupId, message: data.message }));
        scrollToBottom();
      };

      const handleMessageEdited = (data) => {
        dispatch(updateMessage({ groupId, message: data.message }));
      };

      const handleMessageDeleted = (data) => {
        dispatch(removeMessage({ groupId, messageId: data.messageId }));
      };

      const handleFileUploaded = (data) => {
        setGroupFiles(prev => [data.file, ...prev]);
        dispatch(addMessage({ groupId, message: data.message }));
      };

      const handleFileDeleted = (data) => {
        setGroupFiles(prev => prev.filter(f => f._id !== data.fileId));
      };

      socket.on("new-message", handleNewMessage);
      socket.on("message-edited", handleMessageEdited);
      socket.on("message-deleted", handleMessageDeleted);
      socket.on("file-uploaded", handleFileUploaded);
      socket.on("file-deleted", handleFileDeleted);

      return () => {
        leaveGroupSocket(groupId);
        socket.off("new-message", handleNewMessage);
        socket.off("message-edited", handleMessageEdited);
        socket.off("message-deleted", handleMessageDeleted);
        socket.off("file-uploaded", handleFileUploaded);
        socket.off("file-deleted", handleFileDeleted);
      };
    }
  }, [groupId, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages[groupId]]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const result = await dispatch(sendMessageAction({ groupId, content: messageInput.trim() }));
    if (sendMessageAction.fulfilled.match(result)) {
      setMessageInput("");
      scrollToBottom();
    }
  };

  const handleFileUpload = async () => {
    if (!fileInput) return;

    setUploading(true);
    try {
      await uploadFile(groupId, fileInput);
      setFileInput(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      loadFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const blob = await downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file");
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await deleteFileService(fileId);
      loadFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file");
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;

    const result = await dispatch(leaveGroupAction(groupId));
    if (leaveGroupAction.fulfilled.match(result)) {
      navigate("/groups");
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) return;

    const result = await dispatch(deleteGroupAction(groupId));
    if (deleteGroupAction.fulfilled.match(result)) {
      navigate("/groups");
    }
  };

  const isAdmin = currentGroup && (
    currentGroup.creator?._id === user?._id ||
    currentGroup.creator === user?._id ||
    currentGroup.admins?.some(a => a._id === user?._id || a === user?._id)
  );

  const groupMessages = messages[groupId] || [];

  return (
    <ProtectedRoute>
      <div className="group-detail-container">
        {groupLoading ? (
          <div className="loading">Loading group...</div>
        ) : groupError ? (
          <div className="error-message">
            <p>Error loading group: {groupError}</p>
            <button className="btn-primary" onClick={() => navigate("/groups")}>
              Back to Groups
            </button>
          </div>
        ) : currentGroup ? (
          <>
            <div className="group-detail-header">
              <div>
                <h1>{currentGroup.name}</h1>
                {currentGroup.description && <p>{currentGroup.description}</p>}
                <div className="group-info">
                  <span>👥 {currentGroup.members?.length || 0} members</span>
                  {currentGroup.subject && <span>📚 {currentGroup.subject}</span>}
                </div>
              </div>
              <div className="group-actions-header">
                {isAdmin && (
                  <button className="btn-danger" onClick={handleDeleteGroup}>
                    Delete Group
                  </button>
                )}
                <button className="btn-secondary" onClick={handleLeaveGroup}>
                  Leave Group
                </button>
              </div>
            </div>

            <div className="group-tabs">
              <button
                className={activeTab === "chat" ? "active" : ""}
                onClick={() => setActiveTab("chat")}
              >
                💬 Chat
              </button>
              <button
                className={activeTab === "files" ? "active" : ""}
                onClick={() => setActiveTab("files")}
              >
                📁 Files
              </button>
              <button
                className={activeTab === "members" ? "active" : ""}
                onClick={() => setActiveTab("members")}
              >
                👥 Members
              </button>
            </div>

            {activeTab === "chat" && (
              <div className="chat-container">
                <div className="messages-container">
                  {isLoading && groupMessages.length === 0 ? (
                    <div className="loading">Loading messages...</div>
                  ) : groupMessages.length === 0 ? (
                    <div className="empty-state">No messages yet. Start the conversation!</div>
                  ) : (
                    groupMessages.map((message) => (
                      <div
                        key={message._id}
                        className={`message ${message.sender?._id === user?._id || message.sender === user?._id ? "own" : ""} ${message.type === "system" ? "system" : ""}`}
                      >
                        {message.type !== "system" && (
                          <div className="message-avatar">
                            {message.sender?.profilePicture ? (
                              <img src={message.sender.profilePicture} alt={message.sender.name} />
                            ) : (
                              <div className="avatar-placeholder">
                                {message.sender?.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="message-content">
                          {message.type !== "system" && (
                            <div className="message-header">
                              <span className="message-sender">{message.sender?.name}</span>
                              <span className="message-time">
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                          {message.type === "file" && message.file ? (
                            <div className="file-message">
                              <span>📎 {message.file.fileName}</span>
                              <span className="file-size">
                                {(message.file.fileSize / 1024).toFixed(2)} KB
                              </span>
                            </div>
                          ) : (
                            <p>{message.content}</p>
                          )}
                          {message.edited && (
                            <span className="edited-badge">(edited)</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="message-input-form">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                  />
                  <button type="submit" className="btn-primary" disabled={!messageInput.trim()}>
                    Send
                  </button>
                </form>
              </div>
            )}

            {activeTab === "files" && (
              <div className="files-container">
                <div className="file-upload-section">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setFileInput(e.target.files[0])}
                    className="file-input"
                  />
                  {fileInput && (
                    <div className="file-preview">
                      <span>📎 {fileInput.name}</span>
                      <button onClick={handleFileUpload} disabled={uploading} className="btn-primary">
                        {uploading ? "Uploading..." : "Upload"}
                      </button>
                    </div>
                  )}
                </div>

                {loadingFiles ? (
                  <div className="loading">Loading files...</div>
                ) : groupFiles.length === 0 ? (
                  <div className="empty-state">No files uploaded yet.</div>
                ) : (
                  <div className="files-list">
                    {groupFiles.map((file) => (
                      <div key={file._id} className="file-item">
                        <div className="file-info">
                          <span className="file-icon">📄</span>
                          <div>
                            <div className="file-name">{file.originalName}</div>
                            <div className="file-meta">
                              Uploaded by {file.uploadedBy?.name} • {(file.size / 1024).toFixed(2)} KB
                            </div>
                          </div>
                        </div>
                        <div className="file-actions">
                          <button
                            onClick={() => handleDownloadFile(file._id, file.originalName)}
                            className="btn-secondary"
                          >
                            Download
                          </button>
                          {(file.uploadedBy?._id === user?._id || file.uploadedBy === user?._id || isAdmin) && (
                            <button
                              onClick={() => handleDeleteFile(file._id)}
                              className="btn-danger"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "members" && (
              <div className="members-container">
                <div className="members-list">
                  {currentGroup.members?.map((member) => {
                    const memberUser = member.user;
                    const isMemberAdmin = member.role === "admin" || 
                                         currentGroup.admins?.some(a => a._id === memberUser?._id || a === memberUser?._id);
                    return (
                      <div key={memberUser?._id || member.user} className="member-item">
                        <div className="member-avatar">
                          {memberUser?.profilePicture ? (
                            <img src={memberUser.profilePicture} alt={memberUser.name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {memberUser?.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="member-info">
                          <div className="member-name">
                            {memberUser?.name}
                            {isMemberAdmin && <span className="admin-badge">Admin</span>}
                            {currentGroup.creator?._id === memberUser?._id && (
                              <span className="creator-badge">Creator</span>
                            )}
                          </div>
                          {memberUser?.email && (
                            <div className="member-email">{memberUser.email}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>Group not found</p>
            <button className="btn-primary" onClick={() => navigate("/groups")}>
              Back to Groups
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default GroupDetail;
