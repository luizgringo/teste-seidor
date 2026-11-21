import styles from './person-name.module.css'

/**
 * Nome de uma pessoa com a foto redonda ao lado.
 * @param userId - Identificador da pessoa. Sem foto quando não há pessoa.
 * @param name - Nome já resolvido para a tela.
 * @returns O nome, com a bolinha quando existe retrato.
 */
export function PersonName({ userId, name }: { userId: string | null; name: string }) {
  if (!userId) return name
  return (
    <span className={styles.person}>
      <img alt="" className={styles.photo} height={20} src={`/avatars/${userId}.jpg`} width={20} />
      <span className={styles.label}>{name}</span>
    </span>
  )
}
