"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    chatbase: any;
  }
}

export function ChatbotWidget() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const identifyUser = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/chatbase/auth", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to get Chatbase token");
        }

        const data = await response.json();
        
        if (window.chatbase && typeof window.chatbase === "function") {
             window.chatbase("identify", { token: data.token });
        }

      } catch (error) {
        console.error("Failed to identify user for Chatbase:", error);
      }
    };

    identifyUser();
  }, [user]);

  const toggleChat = () => {
    console.log("Toggle chat clicked", window.chatbase);
    if (window.chatbase) {
      window.chatbase("open");
    } else {
      console.warn("Chatbase not initialized");
    }
  };

  const pathname = usePathname();
  // Move the widget up on chat pages to avoid overlapping the input bar
  const isChatPage = pathname?.includes("/chat");

  return (
    <>
      <Button
        onClick={toggleChat}
        className={`fixed ${isChatPage ? "bottom-28" : "bottom-4"} right-4 z-50 rounded-full shadow-lg p-0 transition-all duration-300`}
        style={{ width: "64px", height: "64px" }}
      >
        <Bot className="h-10 w-10" />
      </Button>

      <style jsx global>{`
        #chatbase-bubble-button {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }
      `}</style>
      <Script
        id="chatbase-widget"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              if(!window.chatbase || window.chatbase("getState") !== "initialized"){
                window.chatbase=(...arguments)=>{
                  if(!window.chatbase.q){window.chatbase.q=[]}
                  window.chatbase.q.push(arguments)
                };
                window.chatbase=new Proxy(window.chatbase,{
                  get(target,prop){
                    if(prop==="q"){return target.q}
                    return(...args)=>target(prop,...args)
                  }
                })
              }
              const onLoad=function(){
                const script=document.createElement("script");
                script.src="https://www.chatbase.co/embed.min.js";
                script.id="d_FHa3H1LS1k17VXGnpFg";
                script.domain = "www.chatbase.co";
                document.body.appendChild(script)
              };
              if(document.readyState==="complete"){
                onLoad()
              }else{
                window.addEventListener("load",onLoad)
              }
            })();
          `,
        }}
      />
    </>
  );
}
