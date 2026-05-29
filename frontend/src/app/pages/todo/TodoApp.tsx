import { useState } from 'react';

type FilterType = 'all' | 'active' | 'done';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const addTodo = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setTodos([...todos, { id: Date.now(), text: trimmed, done: false }]);
    setInput('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const clearDone = () => {
    setTodos(todos.filter(t => !t.done));
  };

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  const remaining = todos.filter(t => !t.done).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '20px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '480px',
        overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '32px 28px 24px',
          color: '#fff',
        }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>📝 Todo</h1>
          <p style={{ margin: '6px 0 0', opacity: 0.8, fontSize: '14px' }}>
            {remaining}개 남음
          </p>
        </div>

        {/* 입력창 */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              placeholder="할 일을 입력하세요..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid #e8e8e8',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#667eea'}
              onBlur={e => e.target.style.borderColor = '#e8e8e8'}
            />
            <button
              onClick={addTodo}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '20px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* 필터 탭 */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
          {(['all', 'active', 'done'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: filter === f ? 700 : 400,
                color: filter === f ? '#667eea' : '#999',
                borderBottom: filter === f ? '2px solid #667eea' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {f === 'all' ? '전체' : f === 'active' ? '진행중' : '완료'}
            </button>
          ))}
        </div>

        {/* 할 일 목록 */}
        <ul style={{ margin: 0, padding: '12px 28px', listStyle: 'none', minHeight: '200px' }}>
          {filtered.length === 0 && (
            <li style={{ textAlign: 'center', color: '#ccc', padding: '40px 0', fontSize: '15px' }}>
              {filter === 'done' ? '완료된 항목이 없어요' : '할 일을 추가해보세요 🎉'}
            </li>
          )}
          {filtered.map(todo => (
            <li
              key={todo.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 0',
                borderBottom: '1px solid #f8f8f8',
              }}
            >
              {/* 체크박스 */}
              <div
                onClick={() => toggleTodo(todo.id)}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: todo.done ? 'none' : '2px solid #ddd',
                  background: todo.done ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                {todo.done && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
              </div>

              {/* 텍스트 */}
              <span style={{
                flex: 1,
                fontSize: '15px',
                color: todo.done ? '#bbb' : '#333',
                textDecoration: todo.done ? 'line-through' : 'none',
                transition: 'all 0.2s',
              }}>
                {todo.text}
              </span>

              {/* 삭제 버튼 */}
              <button
                onClick={() => deleteTodo(todo.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ddd',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ff6b6b')}
                onMouseLeave={e => (e.currentTarget.style.color = '#ddd')}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        {/* 하단 */}
        {todos.some(t => t.done) && (
          <div style={{ padding: '12px 28px 20px', textAlign: 'right' }}>
            <button
              onClick={clearDone}
              style={{
                background: 'none',
                border: '1px solid #ffb3b3',
                color: '#ff6b6b',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              완료 항목 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
