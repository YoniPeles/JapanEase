import * as React from "react"
import { cn } from "../../lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const adjustHeight = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      };
      textarea.addEventListener('input', adjustHeight);
      adjustHeight(); // Initial adjustment
      return () => textarea.removeEventListener('input', adjustHeight);
    }
  }, []);

  return (
    <textarea
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "min-h-[2.5rem] overflow-hidden resize-none", // Added styles
        className
      )}
      ref={(node) => {
        textareaRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      rows={1}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }