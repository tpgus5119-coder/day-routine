// ============================================
// Daily Circle Planner - Web Version
// ============================================

// 색상 팔레트
const COLORS = [
    { name: 'coral', primary: '#FF6B6B', secondary: '#FF8E53', glow: 'rgba(255,107,107,0.4)' },
    { name: 'peach', primary: '#FFB199', secondary: '#FFCBA4', glow: 'rgba(255,177,153,0.4)' },
    { name: 'lavender', primary: '#B794F4', secondary: '#D6BCFA', glow: 'rgba(183,148,244,0.4)' },
    { name: 'mint', primary: '#4FD1C5', secondary: '#81E6D9', glow: 'rgba(79,209,197,0.4)' },
    { name: 'sky', primary: '#63B3ED', secondary: '#90CDF4', glow: 'rgba(99,179,237,0.4)' },
    { name: 'gold', primary: '#ECC94B', secondary: '#F6E05E', glow: 'rgba(236,201,75,0.4)' },
    { name: 'rose', primary: '#F687B3', secondary: '#FBB6CE', glow: 'rgba(246,135,179,0.4)' },
    { name: 'teal', primary: '#38B2AC', secondary: '#4FD1C5', glow: 'rgba(56,178,172,0.4)' },
    { name: 'purple', primary: '#9F7AEA', secondary: '#B794F4', glow: 'rgba(159,122,234,0.4)' },
    { name: 'slate', primary: '#718096', secondary: '#A0AEC0', glow: 'rgba(113,128,150,0.4)' },
];

// 샘플 데이터
let timeBlocks = [
    { id: '1', title: '수면', desc: '충분한 수면', startHour: 0, startMin: 0, endHour: 6, endMin: 0, colorIdx: 2, alarm: false },
    { id: '2', title: '출근준비', desc: '샤워, 아침식사', startHour: 6, startMin: 0, endHour: 7, endMin: 30, colorIdx: 3, alarm: true },
    { id: '3', title: '업무', desc: '오전 집중 근무', startHour: 9, startMin: 0, endHour: 12, endMin: 0, colorIdx: 0, alarm: true },
    { id: '4', title: '점심', desc: '식사 시간', startHour: 12, startMin: 0, endHour: 13, endMin: 0, colorIdx: 5, alarm: false },
    { id: '5', title: '업무', desc: '오후 업무', startHour: 13, startMin: 0, endHour: 18, endMin: 0, colorIdx: 0, alarm: false },
    { id: '6', title: '운동', desc: '헬스장', startHour: 18, startMin: 30, endHour: 19, endMin: 30, colorIdx: 7, alarm: true },
    { id: '7', title: '학습', desc: '자기계발', startHour: 21, startMin: 0, endHour: 23, endMin: 0, colorIdx: 8, alarm: true },
];

// 설정
let settings = {
    use24Hour: true,
    fontScale: 1,
};

let selectedBlockId = null;
let editingBlockId = null;
let selectedColorIdx = 0;

// ============================================
// 초기화
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    updateDate();
    initColorPicker();
    drawWheel();
    renderTableList();
    bindEvents();
    applyFontScale();
});

function loadFromStorage() {
    const saved = localStorage.getItem('dailyPlannerBlocks');
    if (saved) timeBlocks = JSON.parse(saved);
    const savedSettings = localStorage.getItem('dailyPlannerSettings');
    if (savedSettings) settings = JSON.parse(savedSettings);
}

function saveToStorage() {
    localStorage.setItem('dailyPlannerBlocks', JSON.stringify(timeBlocks));
    localStorage.setItem('dailyPlannerSettings', JSON.stringify(settings));
}

function updateDate() {
    const now = new Date();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    document.getElementById('currentDate').textContent = 
        `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${weekdays[now.getDay()]})`;
}

// ============================================
// 원형 휠 그리기
// ============================================
function drawWheel() {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 320;
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);
    
    const cx = size / 2;
    const cy = size / 2;
    const innerR = 50;
    const outerR = 130;
    
    ctx.clearRect(0, 0, size, size);
    
    // 배경 원
    ctx.beginPath();
    ctx.arc(cx, cy, outerR + 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 시간 블록 그리기
    timeBlocks.forEach(block => {
        const startAngle = timeToAngle(block.startHour, block.startMin);
        const endAngle = timeToAngle(block.endHour, block.endMin);
        const color = COLORS[block.colorIdx];
        const isSelected = block.id === selectedBlockId;
        
        // 글로우 효과
        if (isSelected) {
            ctx.beginPath();
            ctx.arc(cx, cy, (innerR + outerR) / 2, startAngle, endAngle);
            ctx.strokeStyle = color.glow;
            ctx.lineWidth = outerR - innerR + 16;
            ctx.lineCap = 'round';
            ctx.filter = 'blur(8px)';
            ctx.stroke();
            ctx.filter = 'none';
        }
        
        // 그라데이션
        const grad = ctx.createLinearGradient(
            cx + Math.cos(startAngle) * outerR,
            cy + Math.sin(startAngle) * outerR,
            cx + Math.cos(endAngle) * outerR,
            cy + Math.sin(endAngle) * outerR
        );
        grad.addColorStop(0, color.primary);
        grad.addColorStop(1, color.secondary);
        
        // 호 그리기
        ctx.beginPath();
        ctx.arc(cx, cy, (innerR + outerR) / 2, startAngle, endAngle);
        ctx.strokeStyle = grad;
        ctx.lineWidth = outerR - innerR;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // 레이블
        const duration = getDuration(block);
        if (duration >= 60) {
            const midAngle = (startAngle + endAngle) / 2;
            const labelR = (innerR + outerR) / 2;
            const lx = cx + Math.cos(midAngle) * labelR;
            const ly = cy + Math.sin(midAngle) * labelR;
            
            ctx.save();
            ctx.translate(lx, ly);
            ctx.rotate(midAngle + Math.PI / 2);
            ctx.fillStyle = 'white';
            ctx.font = `600 ${11 * settings.fontScale}px 'Noto Sans KR'`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.fillText(block.title, 0, 0);
            ctx.restore();
        }
    });
    
    // 시간 눈금
    for (let h = 0; h < 24; h++) {
        const angle = timeToAngle(h, 0);
        const isMain = h % 6 === 0;
        const tickStart = outerR + 12;
        const tickEnd = outerR + (isMain ? 22 : 18);
        
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * tickStart, cy + Math.sin(angle) * tickStart);
        ctx.lineTo(cx + Math.cos(angle) * tickEnd, cy + Math.sin(angle) * tickEnd);
        ctx.strokeStyle = isMain ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = isMain ? 2 : 1;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // 숫자
        const labelR = outerR + 35;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR;
        ctx.fillStyle = isMain ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)';
        ctx.font = `${isMain ? '600' : '400'} ${(isMain ? 12 : 9) * settings.fontScale}px 'Noto Sans KR'`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatHourLabel(h), lx, ly);
    }
}

function timeToAngle(hour, min) {
    const totalMins = hour * 60 + min;
    return (totalMins / (24 * 60)) * Math.PI * 2 - Math.PI / 2;
}

function formatHourLabel(h) {
    if (settings.use24Hour) return h.toString();
    if (h === 0) return '12a';
    if (h === 12) return '12p';
    return h < 12 ? `${h}a` : `${h - 12}p`;
}

function getDuration(block) {
    const start = block.startHour * 60 + block.startMin;
    const end = block.endHour * 60 + block.endMin;
    return end >= start ? end - start : (24 * 60 - start) + end;
}

function formatDuration(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}시간 ${m}분`;
    if (h > 0) return `${h}시간`;
    return `${m}분`;
}

function formatTime(h, m) {
    if (settings.use24Hour) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    } else {
        const period = h < 12 ? 'AM' : 'PM';
        const hour = h === 0 ? 12 : (h > 12 ? h - 12 : h);
        return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
    }
}

// ============================================
// 테이블 뷰
// ============================================
function renderTableList() {
    const list = document.getElementById('tableList');
    const sorted = [...timeBlocks].sort((a, b) => 
        (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin)
    );
    
    list.innerHTML = sorted.map(block => {
        const color = COLORS[block.colorIdx];
        const duration = getDuration(block);
        return `
            <div class="table-item" data-id="${block.id}">
                <div class="color-bar" style="background: linear-gradient(180deg, ${color.primary}, ${color.secondary})"></div>
                <div class="content">
                    <div class="title">${block.title}</div>
                    <div class="time">${formatTime(block.startHour, block.startMin)} - ${formatTime(block.endHour, block.endMin)}</div>
                    ${block.desc ? `<div class="desc">${block.desc}</div>` : ''}
                </div>
                ${block.alarm ? '<span class="alarm-icon">🔔</span>' : ''}
                <div class="duration">${formatDuration(duration)}</div>
            </div>
        `;
    }).join('');
    
    // 클릭 이벤트
    list.querySelectorAll('.table-item').forEach(item => {
        item.addEventListener('click', () => selectBlock(item.dataset.id));
    });
}

// ============================================
// 블록 선택/편집
// ============================================
function selectBlock(id) {
    selectedBlockId = id;
    const block = timeBlocks.find(b => b.id === id);
    if (!block) return;
    
    const color = COLORS[block.colorIdx];
    const info = document.getElementById('selectedInfo');
    info.classList.remove('hidden');
    info.querySelector('.selected-color').style.background = `linear-gradient(180deg, ${color.primary}, ${color.secondary})`;
    info.querySelector('.selected-title').textContent = block.title;
    info.querySelector('.selected-time').textContent = `${formatTime(block.startHour, block.startMin)} - ${formatTime(block.endHour, block.endMin)}`;
    info.querySelector('.selected-desc').textContent = block.desc || '';
    
    drawWheel();
}

function closeSelectedInfo() {
    selectedBlockId = null;
    document.getElementById('selectedInfo').classList.add('hidden');
    drawWheel();
}

// ============================================
// 색상 선택기
// ============================================
function initColorPicker() {
    const picker = document.getElementById('colorPicker');
    picker.innerHTML = COLORS.map((c, i) => `
        <div class="color-option ${i === 0 ? 'selected' : ''}" 
             data-idx="${i}" 
             style="background: linear-gradient(135deg, ${c.primary}, ${c.secondary}); --glow: ${c.glow}">
        </div>
    `).join('');
    
    picker.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', () => {
            picker.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedColorIdx = parseInt(opt.dataset.idx);
        });
    });
}

// ============================================
// 모달
// ============================================
function openAddModal() {
    editingBlockId = null;
    document.getElementById('modalTitle').textContent = '새 일정';
    document.getElementById('blockTitle').value = '';
    document.getElementById('blockDesc').value = '';
    document.getElementById('blockStart').value = '09:00';
    document.getElementById('blockEnd').value = '10:00';
    document.getElementById('blockAlarm').checked = false;
    selectedColorIdx = 0;
    initColorPicker();
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function openEditModal(id) {
    editingBlockId = id;
    const block = timeBlocks.find(b => b.id === id);
    if (!block) return;
    
    document.getElementById('modalTitle').textContent = '일정 편집';
    document.getElementById('blockTitle').value = block.title;
    document.getElementById('blockDesc').value = block.desc || '';
    document.getElementById('blockStart').value = `${block.startHour.toString().padStart(2,'0')}:${block.startMin.toString().padStart(2,'0')}`;
    document.getElementById('blockEnd').value = `${block.endHour.toString().padStart(2,'0')}:${block.endMin.toString().padStart(2,'0')}`;
    document.getElementById('blockAlarm').checked = block.alarm;
    selectedColorIdx = block.colorIdx;
    initColorPicker();
    document.querySelector(`.color-option[data-idx="${block.colorIdx}"]`).classList.add('selected');
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}

function saveBlock() {
    const title = document.getElementById('blockTitle').value.trim();
    if (!title) {
        alert('제목을 입력해주세요');
        return;
    }
    
    const startParts = document.getElementById('blockStart').value.split(':');
    const endParts = document.getElementById('blockEnd').value.split(':');
    
    const blockData = {
        title,
        desc: document.getElementById('blockDesc').value.trim(),
        startHour: parseInt(startParts[0]),
        startMin: parseInt(startParts[1]),
        endHour: parseInt(endParts[0]),
        endMin: parseInt(endParts[1]),
        colorIdx: selectedColorIdx,
        alarm: document.getElementById('blockAlarm').checked,
    };
    
    if (editingBlockId) {
        const idx = timeBlocks.findIndex(b => b.id === editingBlockId);
        if (idx !== -1) {
            timeBlocks[idx] = { ...timeBlocks[idx], ...blockData };
        }
    } else {
        timeBlocks.push({
            id: Date.now().toString(),
            ...blockData
        });
    }
    
    saveToStorage();
    closeModal();
    drawWheel();
    renderTableList();
    closeSelectedInfo();
}

function deleteBlock(id) {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    timeBlocks = timeBlocks.filter(b => b.id !== id);
    saveToStorage();
    drawWheel();
    renderTableList();
    closeSelectedInfo();
}

// ============================================
// 설정
// ============================================
function openSettings() {
    document.getElementById('settingsOverlay').classList.remove('hidden');
    updateSettingsUI();
}

function closeSettings() {
    document.getElementById('settingsOverlay').classList.add('hidden');
}

function updateSettingsUI() {
    document.getElementById('format24').classList.toggle('active', settings.use24Hour);
    document.getElementById('format12').classList.toggle('active', !settings.use24Hour);
    
    document.querySelectorAll('[data-size]').forEach(btn => {
        const scale = { small: 0.85, medium: 1, large: 1.2, xlarge: 1.4 }[btn.dataset.size];
        btn.classList.toggle('active', settings.fontScale === scale);
    });
}

function setTimeFormat(use24) {
    settings.use24Hour = use24;
    saveToStorage();
    updateSettingsUI();
    drawWheel();
    renderTableList();
}

function setFontSize(size) {
    const scale = { small: 0.85, medium: 1, large: 1.2, xlarge: 1.4 }[size];
    settings.fontScale = scale;
    saveToStorage();
    applyFontScale();
    updateSettingsUI();
    drawWheel();
    renderTableList();
}

function applyFontScale() {
    document.documentElement.style.setProperty('--font-scale', settings.fontScale);
}

// ============================================
// 이벤트 바인딩
// ============================================
function bindEvents() {
    // 뷰 전환
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.dataset.view;
            document.getElementById('circularView').classList.toggle('hidden', view !== 'circular');
            document.getElementById('tableView').classList.toggle('hidden', view !== 'table');
        });
    });
    
    // 캔버스 클릭
    document.getElementById('wheelCanvas').addEventListener('click', (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left - 160;
        const y = e.clientY - rect.top - 160;
        const angle = Math.atan2(y, x);
        const dist = Math.sqrt(x * x + y * y);
        
        if (dist > 50 && dist < 130) {
            let normalizedAngle = angle + Math.PI / 2;
            if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;
            const clickedHour = Math.floor((normalizedAngle / (Math.PI * 2)) * 24);
            
            const found = timeBlocks.find(block => {
                const start = block.startHour;
                const end = block.endHour;
                if (end > start) {
                    return clickedHour >= start && clickedHour < end;
                } else {
                    return clickedHour >= start || clickedHour < end;
                }
            });
            
            if (found) {
                selectBlock(found.id);
            }
        }
    });
    
    // 버튼들
    document.getElementById('addBtn').addEventListener('click', openAddModal);
    document.getElementById('centerAddBtn').addEventListener('click', openAddModal);
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('navSettings').addEventListener('click', openSettings);
    
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalSave').addEventListener('click', saveBlock);
    
    document.getElementById('settingsClose').addEventListener('click', closeSettings);
    document.getElementById('format24').addEventListener('click', () => setTimeFormat(true));
    document.getElementById('format12').addEventListener('click', () => setTimeFormat(false));
    
    document.querySelectorAll('[data-size]').forEach(btn => {
        btn.addEventListener('click', () => setFontSize(btn.dataset.size));
    });
    
    document.getElementById('editBlockBtn').addEventListener('click', () => {
        if (selectedBlockId) openEditModal(selectedBlockId);
    });
    document.getElementById('deleteBlockBtn').addEventListener('click', () => {
        if (selectedBlockId) deleteBlock(selectedBlockId);
    });
    document.getElementById('closeInfoBtn').addEventListener('click', closeSelectedInfo);
    
    // 모달 바깥 클릭
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
    document.getElementById('settingsOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeSettings();
    });
    
    // 리사이즈
    window.addEventListener('resize', () => drawWheel());
}
