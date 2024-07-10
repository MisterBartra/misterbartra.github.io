/**
 * v0 by Vercel.
 * @see https://v0.dev/t/oPe92m2xH53
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Component() {
  const [activeTab, setActiveTab] = useState(0)
  return (
    <div className="flex h-screen w-full flex-col rounded-lg bg-background text-foreground">
      <div className="flex h-full w-full items-center justify-center">
        <nav className="flex flex-col gap-2 md:flex-col">
          <Button
            variant="solid"
            className={`h-12 rounded-md px-8 font-medium focus:bg-accent focus:text-accent-foreground ${
              activeTab === 0 ? "bg-accent text-accent-foreground" : ""
            }`}
            onClick={() => setActiveTab(0)}
            style={{ padding: "5vh 5vw" }}
          >
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <CogIcon className="h-6 w-6" />
              Conversion Tools
            </div>
          </Button>
          <Button
            variant="solid"
            className={`h-12 rounded-md px-8 font-medium focus:bg-accent focus:text-accent-foreground ${
              activeTab === 1 ? "bg-accent text-accent-foreground" : ""
            }`}
            onClick={() => setActiveTab(1)}
            style={{ padding: "5vh 5vw" }}
          >
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <VideoIcon className="h-6 w-6" />
              Video Downloader
            </div>
          </Button>
          <Button
            variant="solid"
            className={`h-12 rounded-md px-8 font-medium focus:bg-accent focus:text-accent-foreground ${
              activeTab === 2 ? "bg-accent text-accent-foreground" : ""
            }`}
            onClick={() => setActiveTab(2)}
            style={{ padding: "5vh 5vw" }}
          >
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <XIcon className="h-6 w-6" />
              AI Assistants
            </div>
          </Button>
        </nav>
        <div className="relative h-full w-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 grid h-full w-full grid-cols-1 transition-transform duration-500 ease-in-out ${
              activeTab === 0 ? "transform-none" : activeTab === 1 ? "translate-y-[-100vh]" : "translate-y-[-200vh]"
            }`}
          >
            <section className="flex h-screen w-full flex-wrap items-center justify-center gap-4 bg-muted overflow-auto">
              <Link
                href="#"
                className="group flex h-[200px] w-[200px] flex-col items-center justify-center rounded-lg bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <CogIcon className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">ILovePDF</h3>
                  <p className="text-sm text-muted-foreground">Convert PDF files online.</p>
                </div>
              </Link>
              <Link
                href="#"
                className="group flex h-[200px] w-[200px] flex-col items-center justify-center rounded-lg bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <CogIcon className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">ILoveIMG</h3>
                  <p className="text-sm text-muted-foreground">Convert and edit images online.</p>
                </div>
              </Link>
              <Link
                href="#"
                className="group flex h-[200px] w-[200px] flex-col items-center justify-center rounded-lg bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <CogIcon className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">Online-Convert</h3>
                  <p className="text-sm text-muted-foreground">Convert files of all types online.</p>
                </div>
              </Link>
              <Link
                href="#"
                className="group flex h-[200px] w-[200px] flex-col items-center justify-center rounded-lg bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <CogIcon className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">Convertio</h3>
                  <p className="text-sm text-muted-foreground">Convert files, images, and more online.</p>
                </div>
              </Link>
            </section>
            <section className="flex h-screen w-full flex-wrap items-center justify-center gap-4 bg-muted overflow-auto">
              <Link
                href="#"
                className="group flex h-[200px] w-[200px] flex-col items-center justify-center rounded-lg bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <VideoIcon className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">Facebook</h3>
                  <p className="text-sm text-muted-foreground">Download videos from Facebook.</p>
                </div>
              </Link>
              <Link
                href="#"
                className="group flex h-[200px] w-[200px] flex-col items-center justify-center rounded-lg bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <VideoIcon className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">Instagram</h3>
                  <p className="text-sm text-muted-foreground">Download videos from Instagram.</p>
                </div>
              </Link>
              <Link
                href="#"
                className="group flex h-[200px] w-[200px] flex-col items-center justify-center rounded-lg bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <VideoIcon className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">YouTube</h3>
                  <p className="text-sm text-muted-foreground">Download videos from YouTube.</p>
                </div>
              </Link>
            </section>
            <section className="flex h-screen w-full flex-wrap items-center justify-center gap-4 bg-muted overflow-auto">
              <Link
                href="#"
                className="group flex h-[200px] w-[200px] flex-col items-center justify-center rounded-lg bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <XIcon className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">Copilot</h3>
                  <p className="text-sm text-muted-foreground">AI assistant by Microsoft.</p>
                </div>
              </Link>
              <Link
                href="#"
                className="group flex h-[200px] w-[200px] flex-col items-center justify-center rounded-lg bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <XIcon className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">ChatGPT</h3>
                  <p className="text-sm text-muted-foreground">Powerful AI chatbot.</p>
                </div>
              </Link>
              <Link
                href="#"
                className="group flex h-[200px] w-[200px] flex-col items-center justify-center rounded-lg bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <XIcon className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">TutorAI</h3>
                  <p className="text-sm text-muted-foreground">AI tutor and assistant.</p>
                </div>
              </Link>
              <Link
                href="#"
                className="group flex h-[200px] w-[200px] flex-col items-center justify-center rounded-lg bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <XIcon className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">YouTube Transcript Generator</h3>
                  <p className="text-sm text-muted-foreground">Generate transcripts from YouTube videos.</p>
                </div>
              </Link>
              <Link
                href="#"
                className="group flex h-[200px] w-[200px] flex-col items-center justify-center rounded-lg bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <XIcon className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">ToonCrafter</h3>
                  <p className="text-sm text-muted-foreground">AI-powered cartoon creator.</p>
                </div>
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function CogIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M12 2v2" />
      <path d="M12 22v-2" />
      <path d="m17 20.66-1-1.73" />
      <path d="M11 10.27 7 3.34" />
      <path d="m20.66 17-1.73-1" />
      <path d="m3.34 7 1.73 1" />
      <path d="M14 12h8" />
      <path d="M2 12h2" />
      <path d="m20.66 7-1.73 1" />
      <path d="m3.34 17 1.73-1" />
      <path d="m17 3.34-1 1.73" />
      <path d="m11 13.73-4 6.93" />
    </svg>
  )
}


function VideoIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  )
}


function XIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}