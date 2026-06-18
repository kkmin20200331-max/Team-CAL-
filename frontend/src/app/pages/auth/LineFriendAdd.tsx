import "../../../styles/LineFriendAdd.css";

const LineFriendAdd = () => {
  const handleAddFriend = () => {
    // 본인 LINE 공식계정 ID로 변경
    window.open("https://line.me/R/ti/p/@354cpsdr", "_blank");
  };

  const handleSkip = () => {
    // 원하는 메인 화면으로 이동
    window.location.href = "/employee/home";
  };

  return (
    <div className="line-friend-container">
      <div className="line-friend-card">
        <h2>LINE 연동 완료</h2>

        <p>CalPeace 계정과 LINE 계정 연결이 완료되었습니다.</p>

        <p>
          알림을 받으려면 아래 버튼을 눌러 공식 LINE 계정을 친구추가해주세요.
        </p>

        <button className="line-add-btn" onClick={handleAddFriend}>
          친구추가 하기
        </button>

        <button className="line-skip-btn" onClick={handleSkip}>
          나중에 하기
        </button>
      </div>
    </div>
  );
};

export default LineFriendAdd;
