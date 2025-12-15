"use client";

import React, { useState } from "react";
import styles from "./page.module.css";

const FAQS = [
  {
    question: "What is a memory palace?",
    answer:
      "A memory palace is a method that helps you remember information better by using spatial visualization.",
  },
  {
    question: "How can I add rooms and objects?",
    answer:
      "Simply drag the desired icons from the sidebar onto the canvas.",
  },
  {
    question: "What is Loceep?",
    answer:
      "A platform that allows you to create and manage your own memory palace.",
  },
  {
    question: "Can I save my palace?",
    answer:
      "Yes, you can save your palace and load it later for further editing.",
  },
];

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.faqItem}>
      <button
        className={styles.faqQuestion}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {question}
        <span className={styles.faqArrow}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className={styles.faqAnswer}>{answer}</div>}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className={styles.container}>
      
      {/* NEUER HEADER */}
      <header className={styles.header}>
        <h2>FAQ</h2>
        <p>Common questions and answers about Loceep</p>
      </header>

      <div className={styles.faqList}>
        {FAQS.map((faq) => (
          <FAQItem key={faq.question} {...faq} />
        ))}
      </div>
    </div>
  );
}