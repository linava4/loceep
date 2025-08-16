import Image from "next/image";
import styles from "./page.module.css";

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
        <button className={styles.button}>Learn the method</button>
        <button className={styles.button}>Create your palace</button>
        <button className={styles.button}>Use a template</button>
        <button className={styles.button}>Quiz Module</button>
        <button className={styles.button}>FAQ</button>
        <button className={styles.button}>Log-in</button>
        {/*<Image src="/instagramIcon.png" alt="Instagram" width={24} height={24} />*/}
      </div>
    </div>
  );
}
