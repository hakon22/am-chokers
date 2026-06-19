/**
 * Приводит данные SSR/ISR к JSON-сериализуемому виду для Next.js props
 * @param value - произвольные данные из TypeORM-сущностей
 * @returns plain object, безопасный для getStaticProps / getServerSideProps
 */
export const serializeForNextProps = <T>(value: T): T => JSON.parse(JSON.stringify(value));
