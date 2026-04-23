"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  ImageIcon,
  Video,
  Link as LinkIcon,
  Unlink,
  Loader2,
  Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { firebaseStorage } from '@/lib/firebase'
import { Node, mergeAttributes } from '@tiptap/core'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customVideo: {
      setCustomVideo: (options: { src: string }) => ReturnType,
    }
  }
}

const CustomVideo = Node.create({
  name: 'customVideo',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'video' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, { controls: true, class: 'w-full aspect-video rounded-lg border shadow-sm my-6' })
    ]
  },

  addCommands() {
    return {
      setCustomVideo: (options: { src: string }) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
}

const MenuBar = ({ editor }: { editor: any }) => {
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [videoUrlInput, setVideoUrlInput] = useState('')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingImage(true)
    try {
      const storageRef = ref(firebaseStorage, `courses/content_images/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(snapshot.ref)
      editor.chain().focus().setImage({ src: url }).run()
    } catch (err) {
      console.error('Image upload failed:', err)
    } finally {
      setIsUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingVideo(true)
    try {
      const storageRef = ref(firebaseStorage, `courses/content_videos/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(snapshot.ref)
      editor.commands.setCustomVideo({ src: url })
    } catch (err) {
      console.error('Video upload failed:', err)
    } finally {
      setIsUploadingVideo(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) return

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-muted/40 border-b border-border rounded-t-md">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn("h-8 w-8", editor.isActive('bold') ? 'bg-muted text-primary' : 'text-muted-foreground')}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn("h-8 w-8", editor.isActive('italic') ? 'bg-muted text-primary' : 'text-muted-foreground')}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={cn("h-8 w-8", editor.isActive('strike') ? 'bg-muted text-primary' : 'text-muted-foreground')}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn("h-8 w-8", editor.isActive('heading', { level: 2 }) ? 'bg-muted text-primary' : 'text-muted-foreground')}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn("h-8 w-8", editor.isActive('heading', { level: 3 }) ? 'bg-muted text-primary' : 'text-muted-foreground')}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn("h-8 w-8", editor.isActive('bulletList') ? 'bg-muted text-primary' : 'text-muted-foreground')}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn("h-8 w-8", editor.isActive('orderedList') ? 'bg-muted text-primary' : 'text-muted-foreground')}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn("h-8 w-8", editor.isActive('blockquote') ? 'bg-muted text-primary' : 'text-muted-foreground')}
      >
        <Quote className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={setLink}
        className={cn("h-8 w-8", editor.isActive('link') ? 'bg-muted text-primary' : 'text-muted-foreground')}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        className={cn("h-8 w-8 text-muted-foreground")}
      >
        <Unlink className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      {/* Hidden file inputs */}
      <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
      <input type="file" accept="video/mp4,video/webm,video/ogg" ref={videoInputRef} onChange={handleVideoUpload} className="hidden" />

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isUploadingImage}
            className="h-8 w-8 text-muted-foreground hover:text-primary relative"
          >
            {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Upload from computer</Label>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  imageInputRef.current?.click();
                  setImageDialogOpen(false);
                }}
              >
                <Upload className="mr-2 h-4 w-4" /> Select File
              </Button>
            </div>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase">Or</span>
              <div className="flex-grow border-t border-border"></div>
            </div>
            <div className="space-y-2">
              <Label>Paste Image URL</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="https://..." 
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                />
                <Button 
                  type="button" 
                  onClick={() => {
                    if (imageUrlInput) {
                      editor.chain().focus().setImage({ src: imageUrlInput }).run();
                      setImageUrlInput('');
                      setImageDialogOpen(false);
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isUploadingVideo}
            className="h-8 w-8 text-muted-foreground hover:text-red-500 relative"
          >
            {isUploadingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Upload from computer (MP4, WebM)</Label>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  videoInputRef.current?.click();
                  setVideoDialogOpen(false);
                }}
              >
                <Upload className="mr-2 h-4 w-4" /> Select Video File
              </Button>
            </div>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase">Or</span>
              <div className="flex-grow border-t border-border"></div>
            </div>
            <div className="space-y-2">
              <Label>Paste YouTube URL</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="https://youtube.com/..." 
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                />
                <Button 
                  type="button" 
                  onClick={() => {
                    if (videoUrlInput) {
                      editor.commands.setYoutubeVideo({
                        src: videoUrlInput,
                        width: Math.max(320, parseInt('640', 10)) || 640,
                        height: Math.max(180, parseInt('480', 10)) || 480,
                      });
                      setVideoUrlInput('');
                      setVideoDialogOpen(false);
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="h-8 w-8 text-muted-foreground"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="h-8 w-8 text-muted-foreground"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'rounded-lg border object-cover my-4 w-full max-w-2xl mx-auto',
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-lg border shadow-sm my-6',
        },
      }),
      CustomVideo,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4',
        },
      }),
    ],
    content: content || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none min-h-[150px] p-4 outline-none focus:ring-0',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // To update content if prop changes externally (e.g. loading data)
  // useEffect(() => {
  //   if (editor && content !== editor.getHTML()) {
  //     editor.commands.setContent(content)
  //   }
  // }, [content, editor])

  return (
    <div className="border border-border rounded-md overflow-hidden bg-card/50 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
