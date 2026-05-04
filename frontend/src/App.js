import React, { useState, useEffect } from "react";
import "./App.css";

import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy
} from "firebase/firestore";

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

  const [transactions, setTransactions] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // ================= VALIDATION REGEX =================
  const usernameRegex = /^[A-Za-z ]{2,50}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/;
  const idNumberRegex = /^[0-9]{13}$/;
  const accountNumberRegex = /^[0-9]{8,12}$/;
  const recipientRegex = /^[A-Za-z ]{2,50}$/;
  const amountRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
  const swiftCodeRegex = /^[A-Z0-9]{8,11}$/;
  const currencyRegex = /^[A-Z]{3}$/;

  // ================= CLEAR FUNCTIONS =================
  const clearRegistrationFields = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setIdNumber("");
    setAccountNumber("");
  };

  const clearPaymentFields = () => {
    setRecipient("");
    setAmount("");
    setSwiftCode("");
    setCurrency("");
  };

  // ================= AUTH =================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user && !isRegistering) {
        setPage("payment");
      } /*else {
        setMessage("");
      }*/
    });

    return () => unsub();
  }, [isRegistering]);

  // ================= PAGE CHANGE =================
  useEffect(() => {
    if (page === "register") {
      clearRegistrationFields();
    }

    if (page === "login") {
      setPassword("");
    }

    if (page !== "payment") {
      clearPaymentFields();
    }
  }, [page]);

  // ================= TRANSACTIONS =================
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "payments"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(list);
    });

    return () => unsubscribe();
  }, [currentUser]);

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

      setMessage("Redirecting to login...");
      setTimeout(() => {
        setMessage("");
        setPage("login");
        setIsRegistering(false);
      }, 1200);

    } catch (err) {
      setMessage(err.message);
      setIsRegistering(false);
    }
  };

  // ================= LOGIN =================
const login = async () => {
  setMessage("");

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
      setMessage("Currency must be 3 letters (USD, EUR, ZAR).");
      return;
    }

    try {
      await addDoc(collection(db, "payments"), {
        userId: currentUser.uid,
        recipient,
        amount: Number(amount),
        swiftCode: swiftCode.toUpperCase(),
        currency: currency.toUpperCase(),
        createdAt: new Date()
      });

      setMessage("Payment saved successfully.");
    } catch (err) {
      setMessage("Payment failed.");
    }
  };

  // ================= LOGOUT =================
  const logout = async () => {
    setMessage("");
    clearRegistrationFields();
    clearPaymentFields();
    await signOut(auth);
    setPage("register");
  };

  return (
    <div className="app-background">
      <div className="form-card">

        {message && <div className="message">{message}</div>}

        {/* REGISTER */}
        {!currentUser && page === "register" && (
          <>
            <h1>REGISTER</h1>

            <label>USERNAME</label>
            <input value={username} autoComplete="off" onChange={e => setUsername(e.target.value)} />

            <label>EMAIL</label>
            <input value={email} autoComplete="off" onChange={e => setEmail(e.target.value)} />

            <label>ID NUMBER</label>
            <input value={idNumber} autoComplete="off" onChange={e => setIdNumber(e.target.value)} />

            <label>ACCOUNT NUMBER</label>
            <input value={accountNumber} autoComplete="off" onChange={e => setAccountNumber(e.target.value)} />

            <label>PASSWORD</label>
            <input type="password" value={password} autoComplete="new-password" onChange={e => setPassword(e.target.value)} />

            <button onClick={register}>Register</button>

            <button
              className="secondary-btn"
              onClick={() => {
                setEmail("");
                setPassword("");
                setPage("login");
              }}
            >
              Go to Login
            </button>
          </>
        )}

        {/* LOGIN */}
        {!currentUser && page === "login" && (
          <>
            <h1>LOGIN</h1>

 <label>EMAIL</label>
<input
  value={email}
  autoComplete="off"
  onChange={e => {
    setMessage("");
    setEmail(e.target.value);
  }}
/>

<label>PASSWORD</label>
<input
  type="password"
  value={password}
  autoComplete="current-password"
  onChange={e => {
    setMessage("");
    setPassword(e.target.value);
  }}
/>

<button type="button" onClick={login}>Login</button>

            <button className="secondary-btn" onClick={() => setPage("register")}>
              Back
            </button>
          </>
        )}

        {/* PAYMENT */}
        {currentUser && (
          <>
            <h1>MAKE A PAYMENT</h1>

            <label>RECIPIENT</label>
            <input value={recipient} onChange={e => setRecipient(e.target.value)} />

            <label>AMOUNT</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} />

            <label>SWIFT CODE</label>
            <input value={swiftCode} onChange={e => setSwiftCode(e.target.value.toUpperCase())} />

            <label>CURRENCY</label>
            <input value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())} />

            <button onClick={submitPayment}>Pay Now</button>
            <button className="secondary-btn" onClick={logout}>Logout</button>

            <div style={{ marginTop: "30px" }}>
              <h2>TRANSACTION HISTORY</h2>

              {transactions.length === 0 ? (
                <p>No payments yet.</p>
              ) : (
                transactions.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      border: "1px solid #ccc",
                      padding: "12px",
                      marginBottom: "12px",
                      borderRadius: "10px",
                      backgroundColor: "#f9f9f9",
                      textAlign: "left"
                    }}
                  >
                    <p><strong>Recipient:</strong> {t.recipient}</p>
                    <p><strong>Amount:</strong> {t.currency} {Number(t.amount).toFixed(2)}</p>
                    <p><strong>SWIFT:</strong> {t.swiftCode}</p>
                    <p><strong>Currency:</strong> {t.currency}</p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {t.createdAt?.toDate().toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default App;