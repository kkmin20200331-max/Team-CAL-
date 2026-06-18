import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { X, Camera, LogOut, MapPin, User } from "lucide-react";
import { useLanguage } from "../../i18n/useLanguage";
import { translations } from "../../i18n/translations";
import LineLoginButton from "../auth/LineLoginButton";
export default function EmployeeProfilePanel() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = translations.employeeProfilePanel[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const storeName = localStorage.getItem("store_name") || "";

  const [profileImage, setProfileImage] = useState<string>(
    () => localStorage.getItem("employee_profile_image") || "",
  );
  const [open, setOpen] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      localStorage.setItem("employee_profile_image", base64);
      setProfileImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("store_id");
    localStorage.removeItem("store_name");
    navigate("/");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-full hover:opacity-80 transition-opacity flex-shrink-0"
      >
        <Avatar className="w-16 h-16 border-[3px] border-[#07790F] bg-[#80D180]">
          <AvatarImage src={profileImage} className="object-cover" />
          <AvatarFallback className="bg-[#80D180] text-white font-bold text-base">
            {currentUser?.name?.[0] ?? <User className="w-5 h-5" />}
          </AvatarFallback>
        </Avatar>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold text-base">{t.myProfile}</span>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center gap-4">
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar className="w-24 h-24 border-4 border-green-100 bg-white">
              <AvatarImage src={profileImage} className="object-cover" />
              <AvatarFallback className="bg-[#80D180] text-white text-3xl font-bold">
                {currentUser?.name?.[0] ?? <User className="w-10 h-10" />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <p className="text-xs text-gray-400">{t.changePhoto}</p>

          <div className="text-center">
            <p className="text-lg font-bold">
              {currentUser?.name || t.employee}
            </p>
            <Badge className="mt-1 bg-green-100 text-green-700 hover:bg-green-100">
              {currentUser?.role || t.employee}
            </Badge>
          </div>

          <div className="w-full border-t my-1" />

          {storeName && (
            <div className="w-full flex items-center gap-3 px-2">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {storeName}
              </span>
            </div>
          )}
        </div>
        {/* 라인 연동 */}
        <LineLoginButton />
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {t.logout}
          </Button>
        </div>
      </div>
    </>
  );
}
