import React, { useState, useEffect } from "react";
import "./App.css";

import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import { collection, addDoc } from "firebase/firestore";

function App() {
  const [page, setPage] = useState("register");
  const [message, setMessage] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [currency, setCurrency] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const usernameRegex = /^[A-Za-z ]{2,50}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/;
  const idNumberRegex = /^[0-9]{13}$/;
  const accountNumberRegex = /^[0-9]{8,12}$/;
  const recipientRegex = /^[A-Za-z ]{2,50}$/;
  const amountRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
  const swiftCodeRegex = /^[A-Z0-9]{8,11}$/;
  const currencyRegex = /^[A-Z]{3}$/;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user && !isRegistering) {
        setPage("payment");
      }
    });

    return () => unsub();
  }, [isRegistering]);

  // ================= REGISTER =================
  const register = async () => {
    if (!username || !email || !idNumber || !accountNumber || !password) {
      setMessage("Please fill in all registration fields.");
      return;
    }

    if (!usernameRegex.test(username)) {
      setMessage("Username must only contain letters and spaces.");
      return;
    }

    if (!emailRegex.test(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    if (!idNumberRegex.test(idNumber)) {
      setMessage("ID number must be exactly 13 digits.");
      return;
    }

    if (!accountNumberRegex.test(accountNumber)) {
      setMessage("Account number must be 8 to 12 digits.");
      return;
    }

    if (!passwordRegex.test(password)) {
      setMessage("Password must be 12+ characters with uppercase, number and symbol.");
      return;
    }

    try {
      setIsRegistering(true);

      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await addDoc(collection(db, "users"), {
        uid: cred.user.uid,
        username,
        email,
        idNumber,
        accountNumber,
        createdAt: new Date()
      });

      await signOut(auth);
      setCurrentUser(null);

      // ✅ Friendly redirect message
      setMessage("Directing you to the login page now...");
      setPassword("");

      setTimeout(() => {
        setMessage("");
        setPage("login");
        setIsRegistering(false);
      }, 1200);

    } catch (err) {
      setIsRegistering(false);
      setMessage(err.message);
    }
  };

  // ================= LOGIN =================
  const login = async () => {
    if (!email || !password) {
      setMessage("Please enter email and password.");
      return;
    }

    if (!emailRegex.test(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Login successful.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  // ================= PAYMENT =================
  const submitPayment = async () => {
    if (!recipient || !amount || !swiftCode || !currency) {
      setMessage("Please fill in all payment fields.");
      return;
    }

    if (!recipientRegex.test(recipient)) {
      setMessage("Recipient name must only contain letters and spaces.");
      return;
    }

    if (!amountRegex.test(amount) || Number(amount) <= 0) {
      setMessage("Amount must be a valid positive number.");
      return;
    }

    if (!swiftCodeRegex.test(swiftCode.toUpperCase())) {
      setMessage("SWIFT code must be 8 to 11 uppercase letters/numbers.");
      return;
    }

    if (!currencyRegex.test(currency.toUpperCase())) {
      setMessage("Currency must be 3 letters, e.g. USD, EUR, ZAR.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipient,
          amount,
          swiftCode: swiftCode.toUpperCase(),
          currency: currency.toUpperCase()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Backend validation failed.");
        console.log(data.errors);
        return;
      }

      await addDoc(collection(db, "payments"), {
        userId: currentUser.uid,
        recipient,
        amount: Number(amount),
        swiftCode: swiftCode.toUpperCase(),
        currency: currency.toUpperCase(),
        createdAt: new Date()
      });

      setMessage("Payment processed securely via backend.");
      setRecipient("");
      setAmount("");
      setSwiftCode("");
      setCurrency("");
    } catch (err) {
      console.error(err);
      setMessage("Backend error. Make sure backend is running on port 3001.");
    }
  };

  // ================= LOGOUT =================
  const logout = async () => {
    await signOut(auth);
    setPage("register");
  };

  return (
    <div className="app-background">
      <div className="form-card">

        {message && <div className="message">{message}</div>}

        {!currentUser && page === "register" && (
          <>
            <h1>REGISTER</h1>

            <label>USERNAME</label>
            <input value={username} onChange={e => setUsername(e.target.value)} />

            <label>EMAIL</label>
            <input value={email} onChange={e => setEmail(e.target.value)} />

            <label>ID NUMBER</label>
            <input value={idNumber} onChange={e => setIdNumber(e.target.value)} />

            <label>ACCOUNT NUMBER</label>
            <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />

            <label>PASSWORD</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <span className="eye" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>

            <button onClick={register}>Register</button>

            <p>
              Already have an account?{" "}
              <span onClick={() => setPage("login")}>Login</span>
            </p>
          </>
        )}

        {!currentUser && page === "login" && (
          <>
            <h1>LOGIN</h1>

            <label>EMAIL</label>
            <input value={email} onChange={e => setEmail(e.target.value)} />

            <label>PASSWORD</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <span className="eye" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>

            <button onClick={login}>Login</button>
            <button className="secondary-btn" onClick={() => setPage("register")}>
              Back
            </button>
          </>
        )}

        {currentUser && page === "payment" && (
          <>
            <h1>MAKE A PAYMENT</h1>

            <label>RECIPIENT NAME</label>
            <input value={recipient} onChange={e => setRecipient(e.target.value)} />

            <label>AMOUNT</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} />

            <label>SWIFT CODE</label>
            <input value={swiftCode} onChange={e => setSwiftCode(e.target.value.toUpperCase())} />

            <label>CURRENCY</label>
            <input value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())} />

            <button onClick={submitPayment}>Pay Now</button>
            <button className="secondary-btn" onClick={logout}>
              Logout
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default App;