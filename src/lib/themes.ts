// Graph (3D scene) themes — distinct from the app-chrome tokens in index.css.

import type { ThemeName } from '../types'

export interface GraphTheme {
  label: string
  background: string
  gridColor: string
  gridColorMajor: string
  axisX: string
  axisY: string
  axisZ: string
  textColor: string
  ambient: number
  /** Whether the theme reads as "for print" (light, high contrast). */
  print: boolean
}

export const THEMES: Record<ThemeName, GraphTheme> = {
  dark: {
    label: 'Estación',
    background: '#11161e',
    gridColor: '#2a3340',
    gridColorMajor: '#3a4658',
    axisX: '#ff5a78',
    axisY: '#6ec88c',
    axisZ: '#6f8fc4',
    textColor: '#9aa7bb',
    ambient: 0.55,
    print: false,
  },
  light: {
    label: 'Claro',
    background: '#f4f6fb',
    gridColor: '#d4dae6',
    gridColorMajor: '#b7c0d0',
    axisX: '#d6336c',
    axisY: '#2f9e44',
    axisZ: '#1c6fd6',
    textColor: '#3a4150',
    ambient: 0.7,
    print: false,
  },
  blueprint: {
    label: 'Blueprint',
    background: '#0a2540',
    gridColor: '#1c4068',
    gridColorMajor: '#2f5d8f',
    axisX: '#7fd4ff',
    axisY: '#7fd4ff',
    axisZ: '#bfe7ff',
    textColor: '#bfe7ff',
    ambient: 0.6,
    print: false,
  },
  print: {
    label: 'Impresión',
    background: '#ffffff',
    gridColor: '#e2e2e2',
    gridColorMajor: '#c2c2c2',
    axisX: '#333333',
    axisY: '#333333',
    axisZ: '#333333',
    textColor: '#222222',
    ambient: 0.85,
    print: true,
  },
  neon: {
    label: 'Neón',
    background: '#08010f',
    gridColor: '#2a1145',
    gridColorMajor: '#46197a',
    axisX: '#ff4ecd',
    axisY: '#4effc6',
    axisZ: '#7c5cff',
    textColor: '#e7c6ff',
    ambient: 0.5,
    print: false,
  },
}

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[]
