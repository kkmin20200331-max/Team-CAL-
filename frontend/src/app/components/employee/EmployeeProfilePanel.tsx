import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { X, Camera, LogOut, MapPin, User } from "lucide-react";

export default function EmployeeProfilePanel() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  const storeName = sessionStorage.getItem("store_name") || "";

  const [profileImage, setProfileImage] = useState<string>(
    () => sessionStorage.getItem("employee_profile_image") || "",
  );
  const [open, setOpen] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      sessionStorage.setItem("employee_profile_image", base64);
      setProfileImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("store_id");
    sessionStorage.removeItem("store_name");
    navigate("/");
  };

  return (
    <>
      {/* 헤더용 아바타 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-full hover:opacity-80 transition-opacity flex-shrink-0"
      >
        <Avatar className="w-10 h-10 border-2 border-white/60 bg-white">
          <AvatarImage src={profileImage} className="object-cover" />
          <AvatarFallback className="bg-purple-400 text-white font-bold text-sm">
            {currentUser?.name?.[0] ?? <User className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 슬라이딩 패널 */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold text-base">내 프로필</span>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 프로필 정보 */}
        <div className="flex-1 p-6 flex flex-col items-center gap-4">
          {/* 사진 (클릭하면 업로드) */}
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar className="w-24 h-24 border-4 border-purple-100 bg-white">
              <AvatarImage src={profileImage} className="object-cover" />
              <AvatarFallback className="bg-purple-400 text-white text-3xl font-bold">
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
          <p className="text-xs text-gray-400">사진을 클릭해서 변경하세요</p>

          {/* 이름 & 뱃지 */}
          <div className="text-center">
            <p className="text-lg font-bold">{currentUser?.name || "직원"}</p>
            <Badge className="mt-1 bg-purple-100 text-purple-700 hover:bg-purple-100">
              직원
            </Badge>
          </div>

          <div className="w-full border-t my-1" />

          {/* 소속 매장 */}
          {storeName && (
            <div className="w-full flex items-center gap-3 px-2">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {storeName}
              </span>
            </div>
          )}
        </div>

        {/* 로그아웃 */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>
      </div>
    </>
  );
}
