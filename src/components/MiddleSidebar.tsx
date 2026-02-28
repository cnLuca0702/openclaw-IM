import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { Server, Users, Hash, MessageSquare, Trash2, Plus, Edit2 } from 'lucide-react';
import { openClawService } from '../services/openClawService';

interface MiddleSidebarProps {
    activeConnectionId: string | null;
    activeSessionId: string | null;
    onSelectConnection: (id: string) => void;
    onSelectSession: (id: string) => void;
    isDark: boolean;
}

const MiddleSidebar: React.FC<MiddleSidebarProps> = ({
    activeConnectionId,
    activeSessionId,
    onSelectConnection,
    onSelectSession,
}) => {
    const { connections, sessions, removeConnection, addSession, removeSession, updateSession } = useAppStore();
    const [hoveredConnId, setHoveredConnId] = useState<string | null>(null);
    const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

    // 使用真实连接数据（无 mock）
    const displayConnections = connections.map(c => ({ id: c.id, name: c.config.name, status: c.status }));

    // 当前连接的会话列表
    const displaySessions = sessions
        .filter(s => s.connectionId === activeConnectionId)
        .map(s => ({
            id: s.id,
            name: s.name,
            type: s.type,
            unread: s.unreadCount,
            lastMsg: s.lastMessage?.content || '',
            sessionKey: s.sessionKey,
            updatedAt: s.updatedAt,
        }))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const handleNewSession = () => {
        if (!activeConnectionId) return;
        const sessionName = `新对话 ${sessions.filter(s => s.connectionId === activeConnectionId).length + 1}`;
        const sessionId = `session-${Date.now()}`;
        addSession({
            id: sessionId,
            connectionId: activeConnectionId,
            name: sessionName,
            type: 'individual',
            participants: [],
            unreadCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        onSelectSession(sessionId);
    };

    const handleDeleteSession = async (e: React.MouseEvent, sessionId: string, sessionName: string, sessionKey?: string) => {
        e.stopPropagation();
        if (confirm(`确定要删除会话「${sessionName}」吗？`)) {
            // 如果是 WebSocket 模式，并且有 sessionKey，则先发送服务器端删除命令
            if (activeConnectionId && sessionKey) {
                try {
                    await openClawService.deleteSession(activeConnectionId, sessionKey, true);
                } catch (err: any) {
                    console.error('Failed to delete remote session:', err);
                    alert(`服务器会话删除失败: ${err.message}`);
                    return; // 停止本地删除
                }
            }

            removeSession(sessionId);
        }
    };

    const handleRenameSession = async (e: React.MouseEvent, sessionId: string, currentName: string, sessionKey?: string) => {
        e.stopPropagation();
        const newName = prompt(`请输入「${currentName}」的新名称：`, currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
            // 如果是 WebSocket 模式，发送服务器端更新命令
            if (activeConnectionId && sessionKey) {
                try {
                    await openClawService.renameSession(activeConnectionId, sessionKey, newName.trim());
                } catch (err) {
                    console.error('Failed to rename remote session:', err);
                    alert('服务器会话重命名失败');
                    return;
                }
            }
            updateSession(sessionId, { name: newName.trim() });
        }
    };

    const dotColor = (s: string) => {
        switch (s) {
            case 'connected': return '#52c41a';
            case 'waiting': return 'var(--blue-dot)';
            case 'error': return '#ff4d4f';
            default: return '#ccc';
        }
    };

    const SessionIcon: React.FC<{ type: string }> = ({ type }) => {
        switch (type) {
            case 'group': return <Users size={20} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />;
            case 'channel': return <Hash size={20} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />;
            default: return <MessageSquare size={20} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />;
        }
    };

    return (
        <div
            className="flex flex-col shrink-0 overflow-hidden"
            style={{
                width: 280,
                background: 'var(--bg-sidebar)',
                borderRight: '1px solid var(--border-color)',
            }}
        >
            {/* ── CONNECTIONS ─── */}
            <div style={{ padding: '20px 20px 8px' }}>
                <span style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: 'var(--text-muted)',
                }}>
                    连接管理（{displayConnections.length}）
                </span>
            </div>
            <div style={{ padding: '0 12px 8px' }}>
                {displayConnections.map(conn => {
                    const isActive = activeConnectionId === conn.id;
                    const isHovered = hoveredConnId === conn.id;
                    return (
                        <div
                            key={conn.id}
                            onClick={() => onSelectConnection(conn.id)}
                            onMouseEnter={e => {
                                setHoveredConnId(conn.id);
                                if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)';
                            }}
                            onMouseLeave={e => {
                                setHoveredConnId(null);
                                if (!isActive) e.currentTarget.style.background = 'transparent';
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 12px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                background: isActive ? 'var(--bg-hover)' : 'transparent',
                                transition: 'background 0.15s',
                            }}
                        >
                            <Server size={18} strokeWidth={1.5} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                            <span style={{
                                flex: 1,
                                fontSize: 14,
                                fontWeight: isActive ? 500 : 400,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {conn.name}
                            </span>
                            {isHovered ? (
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        if (confirm(`确定要删除连接「${conn.name}」吗？`)) {
                                            removeConnection(conn.id);
                                        }
                                    }}
                                    title="删除连接"
                                    style={{
                                        width: 22,
                                        height: 22,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 4,
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#ff4d4f'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                                >
                                    <Trash2 size={14} strokeWidth={1.5} />
                                </button>
                            ) : (
                                <span style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background: dotColor(conn.status),
                                    flexShrink: 0,
                                }} />
                            )}
                        </div>
                    );
                })}
                {displayConnections.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '20px 0',
                        color: 'var(--text-muted)',
                        fontSize: 13,
                    }}>
                        点击 + 添加连接
                    </div>
                )}
            </div>

            {/* ── SESSIONS ─── */}
            <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: 'var(--text-muted)',
                }}>
                    当前会话（{displaySessions.length}）
                </span>
                {activeConnectionId && (
                    <button
                        onClick={handleNewSession}
                        title="新建会话"
                        style={{
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 6,
                            border: '1px solid var(--border-color)',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.color = 'var(--accent)';
                            e.currentTarget.style.borderColor = 'var(--accent)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        <Plus size={14} strokeWidth={2} />
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto" style={{ padding: '0 12px 12px' }}>
                {displaySessions.map(session => {
                    const isActive = activeSessionId === session.id;
                    const isHovered = hoveredSessionId === session.id;
                    return (
                        <div
                            key={session.id}
                            onClick={() => onSelectSession(session.id)}
                            onMouseEnter={e => {
                                setHoveredSessionId(session.id);
                                if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)';
                            }}
                            onMouseLeave={e => {
                                setHoveredSessionId(null);
                                if (!isActive) e.currentTarget.style.background = isActive ? 'var(--accent-light)' : 'transparent';
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 12px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                background: isActive ? 'var(--accent-light)' : 'transparent',
                                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                                transition: 'background 0.15s',
                            }}
                        >
                            <span style={{ flexShrink: 0, color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                                <SessionIcon type={session.type} />
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 14,
                                    fontWeight: isActive ? 600 : 500,
                                    color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {session.name}
                                </div>
                                {session.lastMsg && (
                                    <div style={{
                                        fontSize: 12,
                                        color: 'var(--text-muted)',
                                        marginTop: 4,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {session.lastMsg}
                                    </div>
                                )}
                            </div>
                            {isHovered ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button
                                        onClick={e => handleRenameSession(e, session.id, session.name, session.sessionKey)}
                                        title="重命名会话"
                                        style={{
                                            width: 22,
                                            height: 22,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 4,
                                            border: 'none',
                                            background: 'transparent',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            transition: 'color 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                                    >
                                        <Edit2 size={14} strokeWidth={1.5} />
                                    </button>
                                    <button
                                        onClick={e => handleDeleteSession(e, session.id, session.name, session.sessionKey)}
                                        title="删除会话"
                                        style={{
                                            width: 22,
                                            height: 22,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 4,
                                            border: 'none',
                                            background: 'transparent',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            transition: 'color 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#ff4d4f'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                                    >
                                        <Trash2 size={14} strokeWidth={1.5} />
                                    </button>
                                </div>
                            ) : session.unread > 0 ? (
                                <span style={{
                                    minWidth: 20,
                                    height: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 6px',
                                    borderRadius: 10,
                                    background: '#ff4d4f',
                                    color: '#ffffff',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    flexShrink: 0,
                                }}>
                                    {session.unread}
                                </span>
                            ) : null}
                        </div>
                    );
                })}
                {displaySessions.length === 0 && activeConnectionId && (
                    <div
                        onClick={handleNewSession}
                        style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            color: 'var(--text-muted)',
                            fontSize: 13,
                            cursor: 'pointer',
                        }}
                    >
                        <Plus size={24} strokeWidth={1.5} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                        点击新建第一个会话
                    </div>
                )}
                {!activeConnectionId && (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 0',
                        color: 'var(--text-muted)',
                        fontSize: 13,
                    }}>
                        请先添加并选择一个连接
                    </div>
                )}
            </div>
        </div>
    );
};

export default MiddleSidebar;
