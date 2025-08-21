"use client"
import Image from "next/image";
import styles from "./page.module.css";
import { useRef } from "react";
import Link from "next/link";

export default function Home() {
  const infoRef = useRef(null);

  const scrollToInfo = () => {
    infoRef.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.pageContainer}>
      
      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.left}>
          <div className={styles.logoBlock}>
            <Image
              src="/LOCeepLogo.png"
              alt="Logo"
              width={120}
              height={80}
            />
            <h1 className={styles.title}>LOCEEP</h1>
          </div>
          <p className={styles.subtitle}>
            YOUR PLATFORM FOR EFFORTLESSLY<br />
            CREATING MEMORY PLACES<br />
            TURNING LEARNING INTO A PLAYFUL AND<br />
            LASTING EXPERIENCE
          </p>
        </div>

        <div className={styles.right}>
          <button className={styles.button} onClick={scrollToInfo}>
            Learn the method
          </button>
          <Link href="/yourpalace" className={styles.button}>Create your palace</Link>
          <Link href="/templates" className={styles.button}>Use a template</Link>
          <Link href="/quiz" className={styles.button}>Quiz Module</Link>
          <Link href="/faq" className={styles.button}>FAQ</Link>
          <Link href="/login" className={styles.button}>Log-in</Link>
        </div>
      </section>

      {/* INFO SECTION */}
      <section ref={infoRef} className={styles.info}>
        <h2>Method of Loci</h2>
        <p>
          The method of loci is a memory technique where you imagine a place
          you know and position things you want to remember in different spots
          along a path through it.
        </p>
        <div className={styles.infolist}>
          <h3>How it works in 4 steps</h3>
          <ol>
            <li>Choose a place</li>
            <li>Place a path (kitchen → living room → bedroom)</li>
            <li>
              Place vivid images of what you want to remember
              <ul>
                <li style={{ listStyle: 'none', marginLeft: '20px' }}>
                  Example: a tooth in your kitchen → loose tooth → Lucy
                </li>
                <li style={{ listStyle: 'none', marginLeft: '20px' }}>
                  The silkier and more visual the better it sticks
                </li>
              </ul>
            </li>
            <li>“Walk” through it and remember</li>
          </ol>

        </div>
      </section>

      <section className={styles.infotwo}>
        <div className={styles.infolistleft}>
        <h4>Create your own memory palace</h4>
        <p>
          Build your own mental Palace to store knowledge in unforgettable places
        </p>
        </div>
        <br />
        <div className={styles.infolistright}>
        <h4>Save your progress</h4>
        <p>
          Pick up where you left off anytime - your palace grows with you
        </p>
        </div>
        <br />
        <div className={styles.infolistleft}>
        <h4>Use a template</h4>
        <p>
          Jump-start your learning with ready-made memory places you can customise
        </p>
        </div>
        <br />
        <div className={styles.infolistright}>
        <h4>Quiz module</h4>
        <p>
          Test your memory by walking through your Palace- no peeking
        </p>
        </div>
        

       
      </section>

    </div>
  );
}
