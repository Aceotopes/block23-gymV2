import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Button,
} from "block23-gym";

export const Hint = () => (
  <TooltipProvider>
    <Tooltip open>
      <TooltipTrigger asChild>
        <Button variant="outline">Days until stockout</Button>
      </TooltipTrigger>
      <TooltipContent>Estimated 4 days at the current sales rate.</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
