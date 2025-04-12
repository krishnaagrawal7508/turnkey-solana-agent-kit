import { useState, useMemo, useRef, useEffect } from "react";
import { myProvider } from "../utils/provider";
import { generateText, type CoreMessage } from "ai";
import { SolanaAgentKit, createVercelAITools } from "solana-agent-kit";
import { Buffer } from "buffer";
import { Connection, PublicKey, sendAndConfirmRawTransaction, SendOptions, Transaction, TransactionSignature, VersionedTransaction } from "@solana/web3.js";
import { marked } from "marked";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import "./Chat.css";
import bs58 from "bs58";
import dotenv from "dotenv";
import { TurnkeySigner } from "@turnkey/solana";

dotenv.config();


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
          content: result.text || "Sorry, I didn’t quite get that.",
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

  return (
    <div className="dashboardCard">
      <div className="configTitle">Chat</div>
      {selectedAccount && (
        <div
          className="walletDiv"
          onClick={() =>
            window.open(`https://solscan.io/account/${selectedAccount}`, "_blank")
          }
        >
          {`${selectedAccount.slice(0, 4)}...${selectedAccount.slice(-4)}`}
        </div>
      )}



      <div className="chatArea">
        {messages.map((m, i) => (
          <div key={i} className={`chatMessage ${m.role}`}>
            {typeof m.content === "string" ? (
              <div
                dangerouslySetInnerHTML={{ __html: marked(m.content) }}
              />
            ) : Array.isArray(m.content) ? (
              m.content.map((part, idx) => {
                if (typeof part === "string") {
                  return (
                    <div
                      key={idx}
                      dangerouslySetInnerHTML={{ __html: marked(part) }}
                    />
                  );
                }
                if ("text" in part && typeof part.text === "string") {
                  return (
                    <div
                      key={idx}
                      dangerouslySetInnerHTML={{ __html: marked(part.text) }}
                    />
                  );
                }
                if ("url" in part && typeof part.url === "string") {
                  return <img key={idx} src={part.url} alt="AI image" />;
                }
                return <span key={idx}>[Unsupported part]</span>;
              })
            ) : (
              "[Unsupported content]"
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>


      <div className="chatInputArea">
        <input
          type="text"
          className="chatInput"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading}
        />
        <button className="chatSendButton" onClick={handleSend} disabled={isLoading}>
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
