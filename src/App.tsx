import { Routes } from "./routes";
import { ChatAIBubble } from "./components/ChatAIBubble";

function App() {
  return (
    <>
      <Routes />
      {/* Chat AI Bubble - hiển thị trên tất cả các trang */}
      <ChatAIBubble />
    </>
  );
}

export default App;
