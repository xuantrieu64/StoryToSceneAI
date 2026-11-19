import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDeleteDialog } from '@/features/story/components/ConfirmDeleteDialog'
import { ASSISTANT_GREETING, SAMPLE_SUMMARY, type OutputTabId } from '../data/output-tabs'
import { AssistantMessage } from './AssistantMessage'
import { ChatComposer } from './ChatComposer'
import { MemoryMenu, type MemoryAction } from './MemoryMenu'
import { OutputPanel } from './OutputPanel'
import { UserMessage } from './UserMessage'

type ChatMessage = { id: number; text: string }
type ClearAction = Exclude<MemoryAction, 'reconnect'>

/** Nội dung hộp xác nhận + thông báo thành công cho từng thao tác xóa bộ nhớ. */
const clearCopy: Record<ClearAction, { title: string; description: string; confirmLabel: string; success: string }> = {
  clearMessages: {
    title: 'Xóa bộ nhớ tin nhắn?',
    description: 'Toàn bộ lịch sử trò chuyện với trợ lý trong dự án này sẽ bị xóa. Bộ nhớ tóm tắt được giữ lại.',
    confirmLabel: 'Xóa tin nhắn',
    success: 'Đã xóa bộ nhớ tin nhắn',
  },
  clearSummary: {
    title: 'Xóa bộ nhớ tóm tắt?',
    description: 'Trợ lý sẽ quên phần tóm tắt nội dung truyện đã ghi nhớ. Lịch sử tin nhắn được giữ lại.',
    confirmLabel: 'Xóa tóm tắt',
    success: 'Đã xóa bộ nhớ tóm tắt',
  },
  clearAll: {
    title: 'Xóa toàn bộ bộ nhớ?',
    description:
      'Thao tác này xóa cả lịch sử tin nhắn và bộ nhớ tóm tắt của trợ lý trong dự án này. Không thể hoàn tác.',
    confirmLabel: 'Xóa toàn bộ',
    success: 'Đã xóa toàn bộ bộ nhớ',
  },
}

/** Thời gian giả lập kết nối lại (chưa có backend). */
const RECONNECT_DELAY_MS = 1200

/**
 * Nội dung màn hình Trợ lý kịch bản: cột chat (trái) và cột kết quả (phải).
 * Chỉ là giao diện – chưa kết nối AI/API; tin nhắn và bộ nhớ tóm tắt chỉ là dữ liệu mẫu trong state.
 * Trang gắn `key={project.id}` để đổi dự án thì làm mới hội thoại.
 */
export function ScriptAssistantWorkspace() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [summary, setSummary] = useState<string | null>(SAMPLE_SUMMARY)
  const [activeTab, setActiveTab] = useState<OutputTabId>('outline')
  const [connecting, setConnecting] = useState(false)
  const [pendingClear, setPendingClear] = useState<ClearAction | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const reconnectTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => () => window.clearTimeout(reconnectTimer.current), [])

  function send(text: string) {
    setMessages((current) => [...current, { id: Date.now() + current.length, text }])
  }

  function reconnect() {
    if (connecting) return
    setConnecting(true)
    const toastId = toast.loading('Đang kết nối lại trợ lý…')
    reconnectTimer.current = window.setTimeout(() => {
      setConnecting(false)
      toast.success('Đã kết nối lại trợ lý', { id: toastId })
    }, RECONNECT_DELAY_MS)
  }

  function handleMemoryAction(action: MemoryAction) {
    if (action === 'reconnect') {
      reconnect()
      return
    }
    // Không có gì để xóa → báo luôn, không cần hộp xác nhận
    const empty =
      (action === 'clearMessages' && messages.length === 0) ||
      (action === 'clearSummary' && summary === null) ||
      (action === 'clearAll' && messages.length === 0 && summary === null)
    if (empty) {
      toast.info(action === 'clearSummary' ? 'Bộ nhớ tóm tắt đang trống' : action === 'clearMessages' ? 'Chưa có tin nhắn nào để xóa' : 'Bộ nhớ đang trống')
      return
    }
    setPendingClear(action)
  }

  function confirmClear() {
    if (!pendingClear) return
    if (pendingClear !== 'clearSummary') setMessages([])
    if (pendingClear !== 'clearMessages') setSummary(null)
    if (pendingClear === 'clearAll') setActiveTab('outline')
    toast.success(clearCopy[pendingClear].success)
    setPendingClear(null)
  }

  const dialog = pendingClear ? clearCopy[pendingClear] : null

  return (
    <div className="flex h-[calc(100vh-152px)] min-h-[560px] rounded-xl border border-[#eceef1] bg-white max-[900px]:h-auto max-[900px]:flex-col">
      {/* Cột chat */}
      <section
        aria-label="Trò chuyện với trợ lý"
        className="flex w-[40%] min-w-[380px] flex-col p-6 pr-8 max-[1100px]:min-w-0 max-[900px]:min-h-[520px] max-[900px]:w-full max-[760px]:p-4"
      >
        <div className="-mr-2 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2" ref={listRef}>
          <AssistantMessage connecting={connecting} onStart={() => send('Bắt đầu')} text={ASSISTANT_GREETING} />
          {messages.map((message) => (
            <UserMessage key={message.id} text={message.text} />
          ))}
        </div>
        <div className="pt-4">
          <ChatComposer onSend={send} tools={<MemoryMenu connecting={connecting} onAction={handleMemoryAction} />} />
        </div>
      </section>

      {/* Cột kết quả */}
      <div className="my-6 flex min-w-0 flex-1 flex-col border-l border-[#eceef1] px-10 max-[1100px]:px-6 max-[900px]:my-0 max-[900px]:border-l-0 max-[900px]:border-t max-[900px]:py-6 max-[760px]:px-4">
        <OutputPanel activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <ConfirmDeleteDialog
        confirmLabel={dialog?.confirmLabel ?? ''}
        description={dialog?.description ?? ''}
        onCancel={() => setPendingClear(null)}
        onConfirm={confirmClear}
        open={dialog !== null}
        title={dialog?.title ?? ''}
      />
    </div>
  )
}
