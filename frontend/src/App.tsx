import Chat from './Components/chat/Chat'
import type { Language } from './types';

function App() {
  const lang: Language = "ar";

  return <Chat lang={lang} />
}

export default App
