import { useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, AlertTriangle, Zap,
  Copy, Check, LayoutGrid, FileText, Sparkles, Trophy, ChevronDown, ChevronUp
} from 'lucide-react';
import './AIReportViewer.css';

/**
 * Format inline text: bold, italic, money figures, and percentages into rich HTML spans
 */
function renderInlineFormatted(text) {
  if (!text) return null;

  // Tách text theo các tokens: bold (**...**), italic (*...*), tiền tệ (VD: 2.030.000đ), phần trăm (VD: 69%)
  const tokenRegex = /(\*\*.*?\*\*|\*.*?\*|\b\d{1,3}(?:\.\d{3})+(?:đ|VNĐ)|\b\d+(?:\.\d+)?%)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold: **...**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2).trim();
      if (/^\d{1,3}(?:\.\d{3})+(?:đ|VNĐ)$/.test(inner)) {
        return <span key={index} className="ai-metric-money">{inner}</span>;
      }
      if (/^\d+(?:\.\d+)?%$/.test(inner)) {
        return <span key={index} className="ai-metric-pct">{inner}</span>;
      }
      return <strong key={index} className="ai-text-bold">{inner}</strong>;
    }

    // Italic: *...*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1).trim();
      return <em key={index} className="ai-text-em">{inner}</em>;
    }

    // Money: 1.000.000đ, 2.230.000đ
    if (/^\d{1,3}(?:\.\d{3})+(?:đ|VNĐ)$/.test(part)) {
      return (
        <span key={index} className="ai-metric-money">
          {part}
        </span>
      );
    }

    // Percentage: 77.1%, 69%
    if (/^\d+(?:\.\d+)?%$/.test(part)) {
      return (
        <span key={index} className="ai-metric-pct">
          {part}
        </span>
      );
    }

    return part;
  });
}

/**
 * AIReportViewer Component - Trình bày kết quả AI phân tích chuyên sâu
 */
export default function AIReportViewer({ content, period, onCopyToast }) {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'doc'
  const [copied, setCopied] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Parse markdown content into structured sections
  const { intro, sections } = useMemo(() => {
    if (!content) return { intro: '', sections: [] };

    const lines = content.split('\n');
    let introLines = [];
    const parsedSections = [];
    let currentSec = null;

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Check for section header (### 1. ... or ## 1. ... or 1. 💰 ...)
      let isHeader = false;
      let rawTitle = '';

      const mdMatch = line.match(/^#{1,4}\s*(.*)$/);
      if (mdMatch) {
        isHeader = true;
        rawTitle = mdMatch[1].trim();
      } else {
        const numberedEmojiMatch = line.match(/^(\*{0,2})((?:\d+[\.\)]|[IVX]+[\.\)])\s*(?:💰|🏆|📈|🎯|📊)?\s*[^:*]+)(\*{0,2}):?$/i);
        if (numberedEmojiMatch && (line.includes('💰') || line.includes('🏆') || line.includes('📈') || line.includes('🎯') || /DÒNG TIỀN|HIỆU QUẢ|XU HƯỚNG|CHIẾN LƯỢC|DOANH THU/i.test(line))) {
          isHeader = true;
          rawTitle = numberedEmojiMatch[2].trim();
        }
      }

      if (isHeader) {
        if (currentSec) {
          parsedSections.push(currentSec);
        }

        // Detect theme & icon
        let theme = 'slate';
        let IconComp = Sparkles;
        const upper = rawTitle.toUpperCase();

        if (upper.includes('DÒNG TIỀN') || upper.includes('DOANH THU') || rawTitle.includes('💰')) {
          theme = 'emerald';
          IconComp = DollarSign;
        } else if (upper.includes('HIỆU QUẢ') || upper.includes('MÔN') || upper.includes('SÂN') || rawTitle.includes('🏆')) {
          theme = 'indigo';
          IconComp = Trophy;
        } else if (upper.includes('XU HƯỚNG') || upper.includes('RỦI RO') || upper.includes('CẢNH BÁO') || rawTitle.includes('📈')) {
          theme = 'amber';
          IconComp = AlertTriangle;
        } else if (upper.includes('CHIẾN LƯỢC') || upper.includes('ĐỀ XUẤT') || upper.includes('GIÁ') || rawTitle.includes('🎯')) {
          theme = 'purple';
          IconComp = Zap;
        }

        currentSec = {
          title: rawTitle,
          theme,
          IconComp,
          items: []
        };
      } else if (currentSec) {
        // Line belongs to current section
        currentSec.items.push(line);
      } else {
        // Line belongs to intro
        introLines.push(line);
      }
    }

    if (currentSec) {
      parsedSections.push(currentSec);
    }

    return {
      intro: introLines.join(' '),
      sections: parsedSections
    };
  }, [content]);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    if (onCopyToast) onCopyToast('Đã sao chép toàn bộ báo cáo tài chính AI!');
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (idx) => {
    setCollapsedSections(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (!content) return null;

  return (
    <div className="ai-report-viewer">
      {/* ── Toolbar ────────────────────────────────────── */}
      <div className="ai-report-toolbar">
        <div className="ai-report-period-badge">
          <Sparkles size={14} color="#6366F1" />
          <span>Khoảng thời gian: <strong>{period || 'Toàn bộ'}</strong></span>
        </div>

        <div className="ai-report-tools">
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              className={`ai-view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Hiển thị dạng thẻ chuyên đề đẹp mắt, phân khối rõ ràng"
            >
              <LayoutGrid size={13} />
              <span>Thẻ Chuyên Đề</span>
            </button>
            <button
              type="button"
              className={`ai-view-mode-btn ${viewMode === 'doc' ? 'active' : ''}`}
              onClick={() => setViewMode('doc')}
              title="Hiển thị dạng văn bản tài liệu giãn dòng chuẩn"
            >
              <FileText size={13} />
              <span>Văn Bản Dễ Đọc</span>
            </button>
          </div>

          <button
            type="button"
            className={`ai-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Sao chép toàn bộ nội dung báo cáo vào clipboard"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép báo cáo'}</span>
          </button>
        </div>
      </div>

      {/* ── Executive Summary / Intro Banner ───────────── */}
      {intro && (
        <div className="ai-report-intro-box">
          <p>{intro}</p>
        </div>
      )}

      {/* ── Mode 1: Executive Dashboard Cards View ─────── */}
      {viewMode === 'cards' && (
        <div className="ai-report-sections">
          {sections.map((sec, secIdx) => {
            const Icon = sec.IconComp;
            const isCollapsed = !!collapsedSections[secIdx];

            return (
              <div key={secIdx} className={`ai-section-card ai-theme-${sec.theme}`}>
                <div className="ai-section-header" onClick={() => toggleSection(secIdx)}>
                  <div className="ai-section-header-left">
                    <div className="ai-section-icon-box">
                      <Icon size={18} />
                    </div>
                    <h4 className="ai-section-title">{sec.title}</h4>
                  </div>
                  <div>
                    {isCollapsed ? <ChevronDown size={18} color="#94A3B8" /> : <ChevronUp size={18} color="#94A3B8" />}
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="ai-section-body">
                    {sec.items.map((rawItem, itemIdx) => {
                      const trimmed = rawItem.trim();
                      const isSubItem = rawItem.startsWith('  ') || rawItem.startsWith('\t') || trimmed.startsWith('* *') || trimmed.startsWith('- *');

                      // Kiểm tra xem dòng có phải là subheader (VD: "* **Theo loại môn thể thao:**")
                      const subHeaderMatch = trimmed.match(/^[\*\-]?\s*\*\*(.*?)\*\*[:\-]?$/);
                      if (subHeaderMatch) {
                        return (
                          <div key={itemIdx} className="ai-item-subheader">
                            {subHeaderMatch[1]}
                          </div>
                        );
                      }

                      // Strip leading bullet (*, -, 1., 2.)
                      const cleanItem = trimmed.replace(/^(\*|\-|\d+[\.\)])\s*/, '');

                      return (
                        <div key={itemIdx} className={`ai-item-row ${isSubItem ? 'ai-item-subrow' : ''}`}>
                          <span className={`ai-item-bullet ${isSubItem ? 'ai-sub-bullet' : ''}`} />
                          <div className="ai-item-content">
                            {renderInlineFormatted(cleanItem)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Mode 2: Readable Document Flow View ────────── */}
      {viewMode === 'doc' && (
        <div className="ai-doc-view">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="ai-doc-section">
              <h3 className="ai-doc-heading">
                {sec.title}
              </h3>
              <div className="ai-doc-content">
                {sec.items.map((rawItem, itemIdx) => {
                  const cleanItem = rawItem.trim().replace(/^(\*|\-|\d+[\.\)])\s*/, '');
                  return (
                    <p key={itemIdx}>
                      • {renderInlineFormatted(cleanItem)}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
