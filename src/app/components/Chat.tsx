import { useState, useMemo, useRef, useEffect } from "react";
import { myProvider } from "../utils/provider";
import { generateText, type CoreMessage } from "ai";
import { SolanaAgentKit, createVercelAITools } from "solana-agent-kit";
import { Buffer } from "buffer";
import { Connection, PublicKey, sendAndConfirmRawTransaction, SendOptions, Transaction, TransactionSignature, VersionedTransaction } from "@solana/web3.js";
import { marked } from "marked";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import bs58 from "bs58";
import { TurnkeySigner } from "@turnkey/solana";

type AIChatProps = {
  selectedAccount: string | null;
  signer: TurnkeySigner | undefined;
};

export const AIChat: React.FC<AIChatProps> = ({
  selectedAccount,
  signer,
}) => {
  const [messages, setMessages] = useState<CoreMessage[]>([
    { role: "assistant", content: "Hi! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const solanaTools = useMemo(() => {
    if (selectedAccount && signer) {
      const wallet = selectedAccount;
      const agent = new SolanaAgentKit(
        {
          publicKey: new PublicKey(selectedAccount as string),
          signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
            console.log("sign transaction");
            if (!signer) throw new Error("Turnkey signer not initialized.");

            const signedTransaction = (await signer.signTransaction(
              tx,
              selectedAccount,
            ));
            return signedTransaction as T;
          },
          signMessage: async (msg) => {
            console.log("sign message");
            if (!signer) throw new Error("Turnkey signer not initialized.");

            const signedMessage = (await signer.signMessage(
              msg,
              selectedAccount,
            ));

            return signedMessage;
          },
          sendTransaction: async (tx) => {
            console.log("send transaction");

            if (!signer) throw new Error("Turnkey signer not initialized.");

            const connection = new Connection(
              process.env.NEXT_PUBLIC_RPC_URL as string,
              "confirmed"
            );
            const latestBlockHash = await connection.getLatestBlockhash();
            const sig = "version" in tx ? tx.signatures[0]! : tx.signature!;

            if (tx instanceof Transaction) {
              const signature = bs58.encode(sig as Uint8Array);

              const transactionHash = await sendAndConfirmRawTransaction(
                connection,
                tx.serialize(),
                {
                  blockhash: latestBlockHash.blockhash,
                  lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                  signature,
                },
                { commitment: "confirmed" }
              );
              return transactionHash;
            }

            else if (tx instanceof VersionedTransaction) {
              const signature = bs58.encode(sig as Uint8Array);
              const serialized = Buffer.from(tx.serialize()); 
              const transactionHash = await sendAndConfirmRawTransaction(
                connection,
                serialized ,
                {
                  blockhash: latestBlockHash.blockhash,
                  lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                  signature,
                },
                { commitment: "confirmed" }
              );
              return transactionHash;
            }

            else{
              throw new Error("Error: while sending transaction");
            }
          },
          signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
            console.log("sign all transaction");
            if (!signer) throw new Error("Turnkey signer not initialized.");

            const signedTransaction = (await signer.signAllTransactions(
              txs,
              selectedAccount,
            ));
            return signedTransaction as T[];
          },
          signAndSendTransaction: async <T extends Transaction | VersionedTransaction>(
            tx: T,
            options?: SendOptions
          ): Promise<{ signature: string }> => {
            console.log("sign and send transaction");
            if (!signer) throw new Error("Turnkey signer not initialized.");

            const signedTransaction = (await signer.signTransaction(
              tx,
              selectedAccount,
            )) as T;

            const connection = new Connection(
              process.env.NEXT_PUBLIC_RPC_URL as string,
              "confirmed"
            );
            const latestBlockHash = await connection.getLatestBlockhash();
            const sig = "version" in tx ? tx.signatures[0]! : tx.signature!;

            if (tx instanceof Transaction) {
              const signature = bs58.encode(sig as Uint8Array);

              const transactionHash = await sendAndConfirmRawTransaction(
                connection,
                tx.serialize(),
                {
                  blockhash: latestBlockHash.blockhash,
                  lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                  signature,
                },
                { commitment: "confirmed" }
              );
              return {signature: transactionHash};
            }

            else if (tx instanceof VersionedTransaction) {
              const signature = bs58.encode(sig as Uint8Array);
              const serialized = Buffer.from(tx.serialize()); 
              const transactionHash = await sendAndConfirmRawTransaction(
                connection,
                serialized ,
                {
                  blockhash: latestBlockHash.blockhash,
                  lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                  signature,
                },
                { commitment: "confirmed" }
              );
              return {signature: transactionHash};
            }

            else{
              throw new Error("Error: while sending transaction");
            }
          },
        },
        process.env.NEXT_PUBLIC_RPC_URL as string,
        {},
      ).use(TokenPlugin);

      const tools = createVercelAITools(agent, agent.actions);
      return tools;
    }
  }, [selectedAccount]);


  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: CoreMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const result = await generateText({
        model: myProvider.languageModel("chat-model"),
        messages: updatedMessages,
        system: "You're a helpful Solana assistant that helps people carry out transactions and actions on the Solana blockchain. You can only perform actions and answer questions related to Solana.",
        maxSteps: 5,
        tools: solanaTools,
      });

      console.log(result);

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: result.text || "Sorry, I didn't quite get that.",
        },
      ]);
    } catch (error) {
      console.error("AI error:", error);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "Oops! Something went wrong.",
        },
      ]);
    }

    setIsLoading(false);
  };

  // Get current timestamp for messages
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-4xl flex flex-col h-[calc(100vh-80px)] mt-16 mx-auto px-4">
      <div className="chat-container flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role !== 'user' && (
                <div className="flex-shrink-0 mr-3">
                  <div className="bg-white rounded-md p-1 flex items-center justify-center w-8 h-8">
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-[#282c3a]"
                    >
                      <rect width="24" height="24" rx="4" fill="currentColor" />
                      <path d="M16 8.5C16 10.9853 13.9853 13 11.5 13C9.01472 13 7 10.9853 7 8.5C7 6.01472 9.01472 4 11.5 4C13.9853 4 16 6.01472 16 8.5Z" fill="#ffffff" />
                      <path d="M11.5 14C7.35786 14 4 17.3579 4 21.5H19C19 17.3579 15.6421 14 11.5 14Z" fill="#ffffff" />
                    </svg>
                  </div>
                </div>
              )}
              
              <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center mb-1">
                  <span className="text-xs text-gray-400 mr-2">
                    {m.role === 'user' ? 'Tommy Radison' : 'Sense AI'}
                  </span>
                  <span className="text-xs text-gray-500">{getCurrentTime()}</span>
                </div>
                
                <div className={m.role === 'user' ? 'chat-message-user' : 'chat-message-ai'}>
                  {typeof m.content === "string" ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: marked(m.content) }}
                      className="prose prose-sm max-w-none"
                    />
                  ) : Array.isArray(m.content) ? (
                    m.content.map((part, idx) => {
                      if (typeof part === "string") {
                        return (
                          <div
                            key={idx}
                            dangerouslySetInnerHTML={{ __html: marked(part) }}
                            className="prose prose-sm max-w-none"
                          />
                        );
                      }
                      if ("text" in part && typeof part.text === "string") {
                        return (
                          <div
                            key={idx}
                            dangerouslySetInnerHTML={{ __html: marked(part.text) }}
                            className="prose prose-sm max-w-none"
                          />
                        );
                      }
                      if ("url" in part && typeof part.url === "string") {
                        return (
                          <div className="my-2">
                            <img 
                              key={idx} 
                              src={part.url} 
                              alt="AI image" 
                              className="rounded-lg max-w-full object-cover shadow-lg" 
                            />
                          </div>
                        );
                      }
                      return <span key={idx}>[Unsupported part]</span>;
                    })
                  ) : (
                    "[Unsupported content]"
                  )}
                </div>
                
                {m.role === 'assistant' && (
                  <div className="flex space-x-2 mt-2">
                    <button className="text-gray-400 hover:text-white p-1 rounded transition-colors">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-white p-1 rounded transition-colors">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-white p-1 rounded transition-colors">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              {m.role === 'user' && (
                <div className="flex-shrink-0 ml-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    TR
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 p-2 relative">
          <div className="relative">
            <input
              type="text"
              className="chat-input pr-12"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={() => {/* Implement file upload */}}
                className="text-gray-400 hover:text-white p-1 rounded transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="text-gray-400 hover:text-white p-1 rounded transition-colors"
              >
                {isLoading ? (
                  <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <div className="flex gap-2">
              <button className="hover:text-white">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </button>
              <button className="hover:text-white">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
              </button>
            </div>
            <div className="text-center">
              Sense AI may contain errors. We recommend checking important information.
            </div>
            <div className="flex gap-2">
              <button className="hover:text-white">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
