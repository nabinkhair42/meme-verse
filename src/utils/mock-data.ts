export const MOCK_MEMES = [
  {
    id: "1",
    url: "https://i.imgflip.com/7pvbju.jpg",
    title: "Programming Debugging",
    author: "CodeMaster",
    createdAt: new Date().toISOString(),
    likes: 342,
    comments: [
      {
        id: "c1",
        text: "This is so relatable!",
        author: "DevLife",
        createdAt: new Date().toISOString(),
      }
    ],
    category: "Trending",
  },
  {
    id: "2",
    url: "https://i.imgflip.com/7sf8tg.jpg",
    title: "Working from Home Reality",
    author: "RemoteGuru",
    createdAt: new Date().toISOString(),
    likes: 256,
    comments: [],
    category: "Trending",
  },
  {
    id: "3",
    url: "https://i.imgflip.com/76rpwf.jpg",
    title: "AI Taking Over",
    author: "FutureTech",
    createdAt: new Date().toISOString(),
    likes: 198,
    comments: [
      {
        id: "c2",
        text: "Too accurate 😂",
        author: "AIEnthusiast",
        createdAt: new Date().toISOString(),
      }
    ],
    category: "Trending",
  },
  {
    id: "4",
    url: "https://i.imgflip.com/8ame2v.jpg",
    title: "CSS Struggles",
    author: "FrontEndDev",
    createdAt: new Date().toISOString(),
    likes: 415,
    comments: [],
    category: "Trending",
  },
  {
    id: "5",
    url: "https://i.imgflip.com/8a58v4.jpg",
    title: "Monday Motivation",
    author: "WorkLifeBalance",
    createdAt: new Date().toISOString(),
    likes: 329,
    comments: [],
    category: "Trending",
  },
  {
    id: "6",
    url: "https://i.imgflip.com/8amr19.jpg",
    title: "Social Media Reality",
    author: "DigitalNomad",
    createdAt: new Date().toISOString(),
    likes: 276,
    comments: [],
    category: "New",
  }
]; 