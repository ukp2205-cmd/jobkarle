"use client"

import { usePathname } from "next/navigation"
import Script from "next/script"

export function ClarityScript() {
  const pathname = usePathname()

  // Don't load Clarity on business admin pages
  const isBusinessPage = pathname?.startsWith("/business")

  if (isBusinessPage) {
    return null
  }

  return (
    <Script id="clarity-script" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "v4c055m3f5");
      `}
    </Script>
  )
}
