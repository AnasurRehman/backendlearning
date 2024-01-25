import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";

function App() {
  useEffect(() => {
    axios
      .get("http://localhost:4000/jokes")
      .then((res) => setJokes(res.data))
      .catch((err) => console.error(err));
  });
  const [jokes, setJokes] = useState([]);
  return (
    <>
      <h1>Jokes</h1>
      <p>Jokes: {jokes.length}</p>
      {jokes.map((item) => {
        <div key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.content}</p>
        </div>;
      })}
    </>
  );
}

export default App;
