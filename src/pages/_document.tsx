import { Html, Head, Main, NextScript } from "next/document";

const Bg: React.FC = () => {
  return (
    <div className="fixed -z-30">
      <div
        className="w-screen fixed h-screen"
        style={{
          backgroundColor: "#fffffff7",
          backdropFilter: "saturate(200%) blur(20px)",
        }}
      />
      <svg
        className="w-screen h-screen fixed -z-10"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 1024"
        fill="none"
      >
        <circle cx="588" cy="579" r="677" fill="url(#paint0_linear)"></circle>
        <circle cx="1349" cy="1189" r="677" fill="#FC7E37"></circle>
        <circle cx="1658" cy="-104" r="677" fill="#E48586"></circle>
        <circle cx="-164" cy="-136" r="677" fill="#764FFB"></circle>
        <defs>
          <linearGradient
            id="paint0_linear"
            x1="588"
            y1="-98"
            x2="588"
            y2="1256"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#62BCFF"></stop>
            <stop offset="1" stopColor="#1A9CFC"></stop>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default function Document() {
  return (
    <Html>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600;1,700;1,800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Bg />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
