import { ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface GameHeaderProps {
  title: string;
  onInstructions: () => void;
  backTo?: string;
}

export default function GameHeader({ title, onInstructions, backTo = "/" }: GameHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <Link href={backTo}>
        <Button variant="ghost" className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Hub
        </Button>
      </Link>
      <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
      <Button
        onClick={onInstructions}
        className="w-10 h-10 rounded-full flex items-center justify-center"
        variant="default"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>
    </div>
  );
}
