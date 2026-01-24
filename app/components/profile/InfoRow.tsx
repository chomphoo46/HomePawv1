import { IconType } from "react-icons";

interface InfoRowProps {
  icon: IconType;
  text: string | number;
}

export default function InfoRow({ icon: Icon, text }: InfoRowProps) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="text-[#D4A373] shrink-0" />
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  );
}