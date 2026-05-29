import { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; }
`;

const Wrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 480px;
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32px 28px 24px;
  color: #fff;

  h1 {
    font-size: 28px;
    font-weight: 700;
  }

  p {
    margin-top: 6px;
    opacity: 0.8;
    font-size: 14px;
  }
`;

const InputArea = styled.div`
  padding: 20px 28px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 10px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #667eea;
  }
`;

const AddButton = styled.button`
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const FilterTab = styled.div`
  display: flex;
  border-bottom: 1px solid #f0f0f0;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  font-size: 14px;
  cursor: pointer;
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  color: ${({ $active }) => ($active ? '#667eea' : '#999')};
  border-bottom: ${({ $active }) => ($active ? '2px solid #667eea' : '2px solid transparent')};
  transition: all 0.2s;
`;

const List = styled.ul`
  margin: 0;
  padding: 12px 28px;
  list-style: none;
  min-height: 200px;
`;

const EmptyMsg = styled.li`
  text-align: center;
  color: #ccc;
  padding: 40px 0;
  font-size: 15px;
`;

const Item = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f8f8f8;
`;

const Circle = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: ${({ $done }) => ($done ? 'none' : '2px solid #ddd')};
  background: ${({ $done }) =>
    $done ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;

  span {
    color: #fff;
    font-size: 12px;
  }
`;

const TodoText = styled.span`
  flex: 1;
  font-size: 15px;
  color: ${({ $done }) => ($done ? '#bbb' : '#333')};
  text-decoration: ${({ $done }) => ($done ? 'line-through' : 'none')};
  transition: all 0.2s;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #ddd;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: color 0.2s;

  &:hover {
    color: #ff6b6b;
  }
`;

const Footer = styled.div`
  padding: 12px 28px 20px;
  text-align: right;
`;

const ClearButton = styled.button`
  background: none;
  border: 1px solid #ffb3b3;
  color: #ff6b6b;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    background: #fff0f0;
  }
`;

export default function App5() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');

  const addTodo = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setTodos([...todos, { id: Date.now(), text: trimmed, done: false }]);
    setInput('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id) => {
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
    <>
      <GlobalStyle />
      <Wrapper>
        <Card>
          <Header>
            <h1>📝 Todo</h1>
            <p>{remaining}개 남음</p>
          </Header>

          <InputArea>
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              placeholder="할 일을 입력하세요..."
            />
            <AddButton onClick={addTodo}>+</AddButton>
          </InputArea>

          <FilterTab>
            {['all', 'active', 'done'].map(f => (
              <TabButton key={f} $active={filter === f} onClick={() => setFilter(f)}>
                {f === 'all' ? '전체' : f === 'active' ? '진행중' : '완료'}
              </TabButton>
            ))}
          </FilterTab>

          <List>
            {filtered.length === 0 && (
              <EmptyMsg>
                {filter === 'done' ? '완료된 항목이 없어요' : '할 일을 추가해보세요 🎉'}
              </EmptyMsg>
            )}
            {filtered.map(todo => (
              <Item key={todo.id}>
                <Circle $done={todo.done} onClick={() => toggleTodo(todo.id)}>
                  {todo.done && <span>✓</span>}
                </Circle>
                <TodoText $done={todo.done}>{todo.text}</TodoText>
                <DeleteButton onClick={() => deleteTodo(todo.id)}>×</DeleteButton>
              </Item>
            ))}
          </List>

          {todos.some(t => t.done) && (
            <Footer>
              <ClearButton onClick={clearDone}>완료 항목 삭제</ClearButton>
            </Footer>
          )}
        </Card>
      </Wrapper>
    </>
  );
}
