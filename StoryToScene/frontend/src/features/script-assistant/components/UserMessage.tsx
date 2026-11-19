/** Tin nhắn người dùng: căn phải, nền xanh nhạt. */
export function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="m-0 max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-[#ecf8eb] px-4 py-2.5 text-sm leading-6 text-[#1f2937]">
        {text}
      </p>
    </div>
  )
}
