"use client";

import React, { useState } from "react";
import styles from "./page.module.css";

const FAQS = [
  {
    question: "Was ist ein Gedächtnispalast?",
    answer:
      "Ein Gedächtnispalast ist eine Methode, um Informationen durch räumliche Vorstellungskraft besser zu merken.",
  },
  {
    question: "Wie kann ich Räume und Objekte hinzufügen?",
    answer:
      "Ziehe einfach die gewünschten Icons aus der Seitenleiste auf die Leinwand.",
  },
  {
    question: "Was ist Loceep?",
    answer:
      "Eine Plattform, um deinen eigenen Gedächtnispalast zu erstellen und zu verwalten.",
  },
  {
    question: "Kann ich meinen Palast speichern?",
    answer:
      "Eine Speicherfunktion ist geplant. Aktuell bleiben die Daten nur während der Sitzung erhalten.",
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
      <br/>
      <h2>FAQ</h2>
      <div className={styles.faqList}>
        {FAQS.map((faq) => (
          <FAQItem key={faq.question} {...faq} />
        ))}
      </div>
    </div>
  );
}