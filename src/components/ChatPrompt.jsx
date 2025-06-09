import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa'

// Función temporal para generar IDs hasta que uuid esté instalado
const generateTempId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const ChatPrompt = () => {
  // Definición de estados
  const [nombre, setNombre] = useState('');
  const [userId, setUserId] = useState('');
  const [fase, setFase] = useState('preguntarNombre');
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [conversations, setConversations] = useState([]);
  const conversationsEndRef = useRef(null);
  const textareaRef = useRef(null)

  // Actualizar URL base de la API
  const API_URL = import.meta.env.PROD 
    ? 'https://chatgptback.vercel.app/api'
    : 'http://localhost:5000/api';

  useEffect(() => {
    // Obtener o crear userId
    let storedUserId = localStorage.getItem('chatUserId');
    if (!storedUserId) {
      storedUserId = generateTempId();
      localStorage.setItem('chatUserId', storedUserId);
    }
    setUserId(storedUserId);

    // Cargar historial
    const loadHistory = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/chat/${storedUserId}`);
        const data = await response.json();
        if (data.conversation) {
          setConversations(data.conversation);
        }
      } catch (error) {
        console.error('Error cargando historial:', error);
      }
    };

    loadHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!prompt.trim()) return
    
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          userId
        }),
      });

      const data = await response.json();
      if (data.conversation) {
        setConversations(data.conversation);
      }
      setPrompt('');
    } catch (error) {
      console.error('Error:', error);
      alert('Error enviando mensaje');
    } finally {
      setIsLoading(false)
      // Enfocar el textarea después de enviar
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }

  // Auto-scroll cuando hay nuevos mensajes
  useEffect(() => {
    if (conversationsEndRef.current) {
      conversationsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversations])

  // Función para formatear el texto con saltos de línea
  const formatText = (text) => {
    // Divide el texto en párrafos y los une con saltos de línea en JSX
    return text.split('\n').map((paragraph, i) => (
      <p key={i} className="mb-2 last:mb-0">{paragraph}</p>
    ));
  };

  // Definir funciones de manejo
  const handleRegistro = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('Por favor ingresa tu nombre');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:5000/api/chat/register', {
        name: nombre.trim()
      });

      if (response.data.userId) {
        setUserId(response.data.userId);
        localStorage.setItem('chatUserId', response.data.userId);
        setFase('chat');
        setConversations([{
          role: 'assistant',
          content: `¡Hola ${nombre}! 👋 Tu ID es: ${response.data.userId}`
        }]);
      }
    } catch (error) {
      console.error('Error en registro:', error);
      alert('No se pudo completar el registro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !userId.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:5000/api/chat/login', {
        name: nombre.trim(),
        userId: userId.trim()
      });

      if (response.data) {
        setFase('chat');
        setConversations(response.data.conversations || []);
      }
    } catch (error) {
      console.error('Error en login:', error);
      alert('Credenciales incorrectas');
    } finally {
      setIsLoading(false);
    }
  };

  // Definir RegistroForm como componente interno
  const RegistroForm = () => (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-purple-700">
        {fase === 'preguntarNombre' ? '¡Bienvenido! 👋' : 'Iniciar Sesión 🔑'}
      </h2>
      <form onSubmit={fase === 'preguntarNombre' ? handleRegistro : handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Tu nombre:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        {fase === 'login' && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Tu ID:</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
        )}
        <div className="flex justify-between items-center">
          <button
            type="submit"
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : fase === 'preguntarNombre' ? 'Registrarme' : 'Iniciar Sesión'}
          </button>
          <button
            type="button"
            onClick={() => setFase(fase === 'preguntarNombre' ? 'login' : 'preguntarNombre')}
            className="text-purple-600 hover:underline"
          >
            {fase === 'preguntarNombre' ? '¿Ya tienes ID?' : '¿Eres nuevo?'}
          </button>
        </div>
      </form>
    </div>
  );

  // Renderizado condicional basado en la fase
  return (
    <div className="bg-white shadow-2xl rounded-xl overflow-hidden border border-purple-200 mx-auto max-w-2xl">
      {/* Header del chat */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 text-center shadow-md">
        <h2 className="text-xl font-bold flex items-center justify-center">
          <FaRobot className="mr-2 text-purple-200" /> Tavid - Tu Parcero Tecnológico
        </h2>
      </div>

      {fase !== 'chat' ? (
        <RegistroForm />
      ) : (
        <>
          {/* Historial de conversaciones con mejor formateo - Altura fija */}
          <div className="h-[400px] overflow-y-auto p-4 bg-gradient-to-b from-purple-50 to-white">
            {conversations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600">
                <div className="p-6 bg-purple-100 rounded-full mb-4 shadow-inner">
                  <FaRobot className="text-5xl text-purple-600" />
                </div>
                <p className="text-xl font-semibold text-purple-800">¡Qué más parcero! 👋</p>
                <p className="mt-2 text-purple-600">Soy Tavid, tu experto en tecnología. ¿En qué te puedo colaborar hoy?</p>
              </div>
            ) : (
              <div className="space-y-5">
                {conversations.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] p-3 rounded-2xl shadow-md ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-tr-none' 
                          : message.role === 'system'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-white text-gray-800 border border-purple-100 rounded-tl-none shadow-md'
                      }`}
                    >
                      <div className="flex items-center mb-1 font-medium">
                        {message.role === 'user' ? (
                          <>
                            <FaUser className="mr-1 text-white" /> <span className="text-white font-bold">Tú</span>
                          </>
                        ) : message.role === 'system' ? (
                          'Sistema'
                        ) : (
                          <>
                            <FaRobot className="mr-1 text-purple-600" /> <span className="text-purple-800">ChatGPT</span>
                          </>
                        )}
                      </div>
                      <div className={`whitespace-pre-wrap leading-relaxed text-sm md:text-base ${message.role === 'user' ? 'font-medium text-white' : ''}`}>
                        {formatText(message.content)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={conversationsEndRef} />
              </div>
            )}
            
            {isLoading && (
              <div className="flex justify-start mt-4">
                <div className="max-w-[85%] p-3 bg-white border border-purple-100 rounded-2xl rounded-tl-none shadow-md">
                  <div className="flex items-center mb-1 font-medium">
                    <FaRobot className="mr-1 text-purple-600" /> <span className="text-purple-800">ChatGPT</span>
                  </div>
                  <div className="flex space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Formulario para enviar el prompt - Botón debajo del texto */}
          <form onSubmit={handleSubmit} className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 border-t border-purple-200">
            <div className="mb-2">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full p-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800 resize-none shadow-inner transition-all"
                rows="2"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center">
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                <FaPaperPlane className="mr-2" /> Enviar
              </button>
            </div>
            
            <p className="text-xs text-purple-500 mt-1 text-center">
              {isLoading ? '⏳ Procesando...' : '💬 Presiona Enter para enviar'}
            </p>
          </form>

          {/* Botón para finalizar conversación */}
          {fase === 'chat' && (
            <div className="flex justify-end p-2 bg-purple-50">
              <button
                onClick={handleFinalizarChat}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Finalizar Chat 👋
              </button>
            </div>
          )}

          {/* Opción para retomar conversación */}
          {fase === 'preguntarNombre' && (
            <div className="p-4">
              <button
                onClick={() => setFase('login')}
                className="text-purple-600 hover:underline"
              >
                ¿Ya tienes una conversación anterior? Retómala aquí
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ChatPrompt
