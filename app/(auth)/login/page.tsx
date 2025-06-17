"use client";
import Button from "@/components/UI/button";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Login = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    setError(""); // Clear previous errors

    const callback = await signIn("credentials", {
      ...loginData,
      redirect: false,
    });

    setLoading(false);

    if (callback?.ok) {
      router.push("/admin");
    }

    if (callback?.error) {
      setError(callback.error);
    }
  };

  return (
    <div>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="text"
          id="email"
          value={loginData.email}
          onChange={(e) =>
            setLoginData({ ...loginData, email: e.currentTarget.value })
          }
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={loginData.password}
          onChange={(e) =>
            setLoginData({ ...loginData, password: e.currentTarget.value })
          }
        />
      </div>
      <Button text={loading ? "Logging in..." : "LOGIN"} onClick={handleLogin} disabled={loading} />
      {error && <span style={{ color: "red" }}>{error}</span>}
    </div>
  );
};

export default Login;
