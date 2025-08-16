import Image from "next/image";
import styles from "./page.module.css";
import Link from 'next/link';

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Linke Seite */}
      <div className={styles.left}>
        <div className={styles.logoBlock}>
          <Image 
            src="/LOCeepLogo.png" 
            alt="Logo" 
            width={120} 
            height={80} />
          <h1 className={styles.title}>LOCEEP</h1>
        </div>
        <p className={styles.subtitle}>
          YOUR PLATFORM FOR EFFORTLESSLY<br />
          CREATING MEMORY PLACES<br />
          TURNING LEARNING INTO A PLAYFUL AND<br />
          LASTING EXPERIENCE
        </p>
      </div>

      {/* Rechte Seite */}
      <div className={styles.right}>
        <Link href="/about" className={styles.button}>Learn the method</Link>
        <Link href="/yourpalace" className={styles.button}>Create your palace</Link>
        <Link href="/templates" className={styles.button}>Use a template</Link>
        <Link href="/quiz" className={styles.button}>Quiz Module</Link>
        <Link href="/faq" className={styles.button}>FAQ</Link>
        <Link href="/login" className={styles.button}>Log-in</Link>
        {/*<Image src="/instagramIcon.png" alt="Instagram" width={24} height={24} />*/}
      </div>
    </div>
  );
}
