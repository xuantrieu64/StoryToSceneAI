import { ArrowRight } from 'lucide-react'
import { sectionIds, siteLinks } from '@/config/site-links'
import { blogPosts } from '../data/home-content'
import { ActionLink } from './shared/ActionLink'
import { homeButton } from './shared/button-styles'
import { Container } from './shared/Container'
import { SectionHeading } from './shared/SectionHeading'

export function BlogSection() {
  return (
    <section id={sectionIds.blog} aria-labelledby="blog-title" className="border-t border-slate-100 bg-white py-16 lg:py-24">
      <Container>
        <SectionHeading
          id="blog-title"
          layout="split"
          eyebrow="Học viện biên kịch & điện ảnh AI"
          title="Góc điện ảnh & Kinh nghiệm chuyển thể"
          description="Cập nhật mẹo viết kịch bản, kỹ thuật phân rã nhịp truyện và xu hướng ứng dụng AI trong quy trình tiền kỳ sản xuất phim."
        />
        <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3 lg:mt-12 lg:gap-8">
          {blogPosts.map((post) => (
            <li key={post.title}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-shadow hover:shadow-lg">
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
                  <img
                    src={post.src}
                    alt=""
                    width={512}
                    height={279}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                  />
                  <span className="absolute top-3 left-3 rounded-md bg-black/60 px-2 py-1 text-[11px] leading-4 font-medium text-jade-100 backdrop-blur-sm">
                    {post.tag}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5 lg:p-6">
                  <p className="text-[11px] leading-4 font-medium tracking-[0.06em] text-slate-400 uppercase">{post.date}</p>
                  <h3 className="mt-2 text-[17px] leading-6 font-bold text-slate-900">{post.title}</h3>
                  <p className="mt-2 flex-1 text-[13px] leading-5 text-slate-500">{post.excerpt}</p>
                  <ActionLink
                    href={siteLinks.blog}
                    unavailableLabel="Chuyên mục bài viết sắp ra mắt"
                    className="mt-6 inline-flex w-fit items-center gap-1 text-xs leading-4 font-semibold text-jade-600 hover:underline"
                  >
                    Đọc tiếp <ArrowRight aria-hidden="true" className="size-3" />
                    <span className="sr-only">: {post.title}</span>
                  </ActionLink>
                </div>
              </article>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex justify-center">
          <ActionLink
            href={siteLinks.blog}
            unavailableLabel="Chuyên mục bài viết sắp ra mắt"
            className={homeButton({ variant: 'soft', size: 'sm', className: 'rounded-full px-6 text-xs' })}
          >
            Xem toàn bộ 36+ bài viết chuyên sâu <ArrowRight aria-hidden="true" className="!size-3.5" />
          </ActionLink>
        </div>
      </Container>
    </section>
  )
}
