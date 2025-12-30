import Link from 'next/link'

interface TagListProps {
  tags: { tag: { id: string; name: string } }[]
}

export default function TagList({ tags }: TagListProps) {
  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(({ tag }) => (
        <Link
          key={tag.id}
          href={`/tags/${tag.name}`}
          className="text-sm text-neutral-400 hover:text-white transition-colors"
        >
          #{tag.name}
        </Link>
      ))}
    </div>
  )
}
