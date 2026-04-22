/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Square, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Download, 
  Trash2, 
  Grid3X3, 
  MousePointer2,
  Eraser,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type TileType = 
  | 'EMPTY'
  | 'WALL'
  | 'FLOOR'
  | 'LADDER'
  | 'SPIKES'
  | 'STAIRS_UP'
  | 'STAIRS_DOWN'
  | 'STAIRS_2X1_UP_L' | 'STAIRS_2X1_UP_R'
  | 'STAIRS_2X1_DOWN_L' | 'STAIRS_2X1_DOWN_R';

type ToolType = TileType | 'STAIRS_2X1_UP' | 'STAIRS_2X1_DOWN' | 'ERASER';

interface MapData {
  [key: string]: TileType;
}

const GRID_WIDTH = 32;
const GRID_HEIGHT = 18;
const TILE_SIZE = 40;
const CANVAS_WIDTH = GRID_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = GRID_HEIGHT * TILE_SIZE;

// --- Constants ---

const COLORS = {
  WALL: '#4B5563', // Gray-600
  FLOOR: '#1F2937', // Gray-800
  LADDER: '#B45309', // Amber-700
  STAIRS: '#374151', // Gray-700
  SPIKES: '#EF4444', // Red-500
  GRID: '#E5E7EB', // Gray-200
  BG: '#FFFFFF',
  HIGHLIGHT: '#3B82F6', // Blue-500
};

// --- Components ---

export default function App() {
  const [map, setMap] = useState<MapData>({});
  const [selectedTool, setSelectedTool] = useState<ToolType>('WALL');
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState<MapData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- History Management ---

  const saveToHistory = useCallback((newMap: MapData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...newMap });
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setMap({ ...history[prevIndex] });
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setMap({ ...history[nextIndex] });
    }
  };

  // --- Drawing Logic ---

  const drawTile = (ctx: CanvasRenderingContext2D, x: number, y: number, type: TileType) => {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    ctx.save();
    
    switch (type) {
      case 'WALL':
        ctx.fillStyle = COLORS.WALL;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        // Add some detail
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        break;

      case 'FLOOR':
        ctx.fillStyle = COLORS.FLOOR;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE / 4);
        break;

      case 'LADDER':
        ctx.strokeStyle = COLORS.LADDER;
        ctx.lineWidth = 4;
        // Rails
        ctx.beginPath();
        ctx.moveTo(px + 8, py);
        ctx.lineTo(px + 8, py + TILE_SIZE);
        ctx.moveTo(px + TILE_SIZE - 8, py);
        ctx.lineTo(px + TILE_SIZE - 8, py + TILE_SIZE);
        ctx.stroke();
        // Rungs
        ctx.lineWidth = 2;
        for (let i = 1; i < 4; i++) {
          const ry = py + (i * TILE_SIZE) / 4;
          ctx.beginPath();
          ctx.moveTo(px + 8, ry);
          ctx.lineTo(px + TILE_SIZE - 8, ry);
          ctx.stroke();
        }
        break;

      case 'SPIKES':
        ctx.fillStyle = COLORS.SPIKES;
        const spikeWidth = TILE_SIZE / 4;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(px + i * spikeWidth, py + TILE_SIZE);
          ctx.lineTo(px + (i + 0.5) * spikeWidth, py + TILE_SIZE / 2);
          ctx.lineTo(px + (i + 1) * spikeWidth, py + TILE_SIZE);
          ctx.fill();
        }
        break;

      case 'STAIRS_UP':
        ctx.fillStyle = COLORS.STAIRS;
        ctx.beginPath();
        ctx.moveTo(px, py + TILE_SIZE);
        ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
        ctx.lineTo(px + TILE_SIZE, py);
        ctx.closePath();
        ctx.fill();
        break;

      case 'STAIRS_DOWN':
        ctx.fillStyle = COLORS.STAIRS;
        ctx.beginPath();
        ctx.moveTo(px, py + TILE_SIZE);
        ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
        ctx.lineTo(px, py);
        ctx.closePath();
        ctx.fill();
        break;

      case 'STAIRS_2X1_UP_L':
        ctx.fillStyle = COLORS.STAIRS;
        ctx.beginPath();
        ctx.moveTo(px, py + TILE_SIZE);
        ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
        ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'STAIRS_2X1_UP_R':
        ctx.fillStyle = COLORS.STAIRS;
        ctx.beginPath();
        ctx.moveTo(px, py + TILE_SIZE);
        ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
        ctx.lineTo(px + TILE_SIZE, py);
        ctx.lineTo(px, py + TILE_SIZE / 2);
        ctx.closePath();
        ctx.fill();
        break;

      case 'STAIRS_2X1_DOWN_L':
        ctx.fillStyle = COLORS.STAIRS;
        ctx.beginPath();
        ctx.moveTo(px, py + TILE_SIZE);
        ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
        ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE / 2);
        ctx.lineTo(px, py);
        ctx.closePath();
        ctx.fill();
        break;
      case 'STAIRS_2X1_DOWN_R':
        ctx.fillStyle = COLORS.STAIRS;
        ctx.beginPath();
        ctx.moveTo(px, py + TILE_SIZE);
        ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
        ctx.lineTo(px, py + TILE_SIZE / 2);
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.restore();
  };

  const [hoverPos, setHoverPos] = useState<{ x: number, y: number } | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Tiles
    Object.entries(map).forEach(([key, type]) => {
      const [x, y] = key.split(',').map(Number);
      drawTile(ctx, x, y, type as TileType);
    });

    // Draw Hover Preview
    if (hoverPos && !isDrawing) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      if (selectedTool === 'ERASER') {
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(hoverPos.x * TILE_SIZE, hoverPos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (selectedTool === 'STAIRS_2X1_UP') {
        drawTile(ctx, hoverPos.x, hoverPos.y, 'STAIRS_2X1_UP_L');
        if (hoverPos.x < GRID_WIDTH - 1) {
          drawTile(ctx, hoverPos.x + 1, hoverPos.y, 'STAIRS_2X1_UP_R');
        }
      } else if (selectedTool === 'STAIRS_2X1_DOWN') {
        drawTile(ctx, hoverPos.x, hoverPos.y, 'STAIRS_2X1_DOWN_L');
        if (hoverPos.x < GRID_WIDTH - 1) {
          drawTile(ctx, hoverPos.x + 1, hoverPos.y, 'STAIRS_2X1_DOWN_R');
        }
      } else {
        drawTile(ctx, hoverPos.x, hoverPos.y, selectedTool as TileType);
      }
      ctx.restore();
    }

    // Draw Grid
    if (showGrid) {
      ctx.strokeStyle = COLORS.GRID;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= GRID_WIDTH; x++) {
        ctx.moveTo(x * TILE_SIZE, 0);
        ctx.lineTo(x * TILE_SIZE, CANVAS_HEIGHT);
      }
      for (let y = 0; y <= GRID_HEIGHT; y++) {
        ctx.moveTo(0, y * TILE_SIZE);
        ctx.lineTo(CANVAS_WIDTH, y * TILE_SIZE);
      }
      ctx.stroke();
    }
  }, [map, showGrid]);

  useEffect(() => {
    render();
  }, [render]);

  // Initialize history and keyboard shortcuts
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{}]);
      setHistoryIndex(0);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex, undo, redo]);

  // --- Interaction ---

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = Math.floor((clientX - rect.left) / (rect.width / GRID_WIDTH));
    const y = Math.floor((clientY - rect.top) / (rect.height / GRID_HEIGHT));

    if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
      const key = `${x},${y}`;
      const newMap = { ...map };

      if (selectedTool === 'ERASER') {
        if (newMap[key]) {
          delete newMap[key];
          setMap(newMap);
        }
      } else if (selectedTool === 'STAIRS_2X1_UP') {
        if (x < GRID_WIDTH - 1) {
          newMap[`${x},${y}`] = 'STAIRS_2X1_UP_L';
          newMap[`${x+1},${y}`] = 'STAIRS_2X1_UP_R';
          setMap(newMap);
        }
      } else if (selectedTool === 'STAIRS_2X1_DOWN') {
        if (x < GRID_WIDTH - 1) {
          newMap[`${x},${y}`] = 'STAIRS_2X1_DOWN_L';
          newMap[`${x+1},${y}`] = 'STAIRS_2X1_DOWN_R';
          setMap(newMap);
        }
      } else {
        if (newMap[key] !== selectedTool) {
          newMap[key] = selectedTool as TileType;
          setMap(newMap);
        }
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    handleInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / GRID_WIDTH));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / GRID_HEIGHT));
    
    if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
      setHoverPos({ x, y });
    } else {
      setHoverPos(null);
    }

    if (isDrawing) {
      handleInteraction(e);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory(map);
    }
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
    handleMouseUp();
  };

  const clearMap = () => {
    if (window.confirm('确定要清空所有图块吗？')) {
      setMap({});
      saveToHistory({});
    }
  };

  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Temporarily hide grid for export
    const wasGridShown = showGrid;
    setShowGrid(false);
    
    // We need to wait for the state update and re-render, but we can also just draw to a temporary canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CANVAS_WIDTH;
    tempCanvas.height = CANVAS_HEIGHT;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw to temp canvas
    tempCtx.fillStyle = COLORS.BG;
    tempCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    Object.entries(map).forEach(([key, type]) => {
      const [x, y] = key.split(',').map(Number);
      drawTile(tempCtx, x, y, type as TileType);
    });

    const link = document.createElement('a');
    link.download = `tilemap-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();

    setShowGrid(wasGridShown);
  };

  // --- UI Helpers ---

  const ToolButton = ({ type, icon: Icon, label, sub }: { type: ToolType, icon: any, label: string, sub?: string }) => (
    <button
      onClick={() => setSelectedTool(type)}
      className={`
        flex flex-col items-center justify-center p-2 rounded-lg transition-all
        ${selectedTool === type 
          ? 'bg-blue-600 text-white shadow-lg scale-105' 
          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
      `}
      title={label}
    >
      <Icon size={20} />
      <span className="text-[10px] mt-1 font-medium leading-tight text-center">
        {label}
        {sub && <div className="text-[8px] opacity-70">{sub}</div>}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="h-16 bg-white border-bottom border-gray-200 px-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <Layers size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">TileMap Architect</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Map Design Tool</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 size={20} />
          </button>
          <button 
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
            title="重做 (Ctrl+Y)"
          >
            <Redo2 size={20} />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button 
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
            title="切换网格"
          >
            <Grid3X3 size={20} />
          </button>
          <button 
            onClick={clearMap}
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
            title="清空地图"
          >
            <Trash2 size={20} />
          </button>
          <button 
            onClick={exportPNG}
            className="ml-2 flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all font-medium text-sm shadow-sm"
          >
            <Download size={18} />
            导出 PNG
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-gray-200/50">
          <div className="relative shadow-2xl bg-white rounded-sm overflow-hidden border-4 border-white">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className="cursor-crosshair block"
              style={{ width: '100%', maxWidth: '1280px', height: 'auto', aspectRatio: '16/9' }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-72 bg-white border-l border-gray-200 flex flex-col shadow-xl z-10">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">图块素材库</h2>
            
            <div className="space-y-6">
              {/* Basic */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                  <Square size={12} /> 基础图块
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <ToolButton type="WALL" icon={Square} label="墙体" />
                  <ToolButton type="FLOOR" icon={Minus} label="地面" />
                  <ToolButton type="LADDER" icon={Layers} label="梯子" />
                  <ToolButton type="SPIKES" icon={Maximize2} label="尖刺" />
                  <ToolButton type="ERASER" icon={Eraser} label="擦除" />
                </div>
              </section>

              {/* Stairs */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                  <TrendingUp size={12} /> 楼梯
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <ToolButton type="STAIRS_UP" icon={TrendingUp} label="1x1 左低" />
                  <ToolButton type="STAIRS_DOWN" icon={TrendingDown} label="1x1 左高" />
                  <ToolButton type="STAIRS_2X1_UP" icon={TrendingUp} label="2x1 左低" />
                  <ToolButton type="STAIRS_2X1_DOWN" icon={TrendingDown} label="2x1 左高" />
                </div>
              </section>

              {/* Help */}
              <section className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <h3 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-2">操作指南</h3>
                <ul className="text-[10px] text-blue-700 space-y-1 list-disc list-inside">
                  <li>点击或拖动以绘制图块</li>
                  <li>使用橡皮擦或右键(暂不支持)删除</li>
                  <li>Ctrl+Z 撤销，Ctrl+Y 重做</li>
                  <li>导出 PNG 时会自动隐藏网格</li>
                </ul>
              </section>
            </div>
          </div>

          <div className="mt-auto p-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>GRID: {GRID_WIDTH}x{GRID_HEIGHT}</span>
              <span>TILES: {Object.keys(map).length}</span>
            </div>
          </div>
        </aside>
      </main>

      {/* Status Bar */}
      <footer className="h-8 bg-gray-900 text-white flex items-center px-4 text-[10px] uppercase tracking-widest font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <MousePointer2 size={10} /> 
            {selectedTool === 'ERASER' ? '当前工具: 橡皮擦' : `当前工具: ${selectedTool}`}
          </span>
          <span className="opacity-40">|</span>
          <span>点击或拖动以绘制</span>
        </div>
      </footer>
    </div>
  );
}
