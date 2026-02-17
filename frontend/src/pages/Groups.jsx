import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchGroups, createGroup, joinGroup, setFilters, clearError } from "../features/groups/groupSlice";
import { setCurrentGroup } from "../features/chat/chatSlice";
import { joinGroup as joinGroupSocket } from "../socket/socket";

const Groups = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    subject: "",
    courseCode: "",
    tags: "",
    isPublic: true,
    allowMemberInvites: true,
    maxMembers: 50
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { groups, isLoading, error, filters } = useSelector((state) => state.groups);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchGroups(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const groupData = {
      ...createFormData,
      tags: createFormData.tags ? createFormData.tags.split(",").map(t => t.trim()) : []
    };
    
    const result = await dispatch(createGroup(groupData));
    if (createGroup.fulfilled.match(result)) {
      setShowCreateModal(false);
      setCreateFormData({
        name: "",
        description: "",
        subject: "",
        courseCode: "",
        tags: "",
        isPublic: true,
        allowMemberInvites: true,
        maxMembers: 50
      });
      navigate(`/groups/${result.payload._id}`);
    }
  };

  const handleJoinGroup = async (groupId) => {
    const result = await dispatch(joinGroup(groupId));
    if (joinGroup.fulfilled.match(result)) {
      joinGroupSocket(groupId);
      dispatch(setCurrentGroup(groupId));
      navigate(`/groups/${groupId}`);
    }
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const isMember = (group) => {
    return group.members?.some(m => m.user?._id === user?._id || m.user === user?._id);
  };

  return (
    <div className="groups-container">
      <div className="groups-header">
        <h1>Study Groups</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Group
        </button>
      </div>

      <div className="groups-filters">
        <input
          type="text"
          placeholder="Search groups..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="filter-input"
        />
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.myGroups}
            onChange={(e) => handleFilterChange("myGroups", e.target.checked)}
          />
          My Groups Only
        </label>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading groups...</div>
      ) : (
        <div className="groups-grid">
          {groups.length === 0 ? (
            <div className="empty-state">
              <p>No groups found. Create one to get started!</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group._id} className="group-card">
                <div className="group-header">
                  <h3>{group.name}</h3>
                  {group.subject && <span className="group-subject">{group.subject}</span>}
                </div>
                {group.description && (
                  <p className="group-description">{group.description}</p>
                )}
                <div className="group-meta">
                  <span>👥 {group.members?.length || 0} members</span>
                  {group.courseCode && <span>📚 {group.courseCode}</span>}
                </div>
                {group.tags && group.tags.length > 0 && (
                  <div className="group-tags">
                    {group.tags.map((tag, idx) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="group-actions">
                  {isMember(group) ? (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        dispatch(setCurrentGroup(group._id));
                        navigate(`/groups/${group._id}`);
                      }}
                    >
                      Open Group
                    </button>
                  ) : (
                    <button
                      className="btn-secondary"
                      onClick={() => handleJoinGroup(group._id)}
                    >
                      Join Group
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Group</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  required
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={createFormData.subject}
                    onChange={(e) => setCreateFormData({ ...createFormData, subject: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Course Code</label>
                  <input
                    type="text"
                    value={createFormData.courseCode}
                    onChange={(e) => setCreateFormData({ ...createFormData, courseCode: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={createFormData.tags}
                  onChange={(e) => setCreateFormData({ ...createFormData, tags: e.target.value })}
                  placeholder="e.g., study, exam, project"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={createFormData.isPublic}
                    onChange={(e) => setCreateFormData({ ...createFormData, isPublic: e.target.checked })}
                  />
                  Public Group
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
