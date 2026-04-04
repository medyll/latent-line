import { describe, it, expect } from 'vitest';
import { generateAaf, downloadAaf } from '$lib/utils/aaf-export';
import type { Model } from '$lib/model/model-types';
import type { AafExportOptions } from '$lib/utils/aaf-export';

const sampleModel: Model = {
  project: { name: 'Test Project', fps: 24, resolution: { w: 1920, h: 1080 } },
  assets: {
    characters: [{ id: 'char_01', name: 'Hero', references: [] }],
    environments: {},
    audio: [{ id: 'audio_01', url: 'https://example.com/music.mp3' }]
  },
  timeline: [
    {
      time: 0,
      duration: 24,
      frame: {
        actors: [{ id: 'char_01' }],
        prompt: 'A hero stands',
        audio_tracks: [{ id: 'audio_01' }]
      },
      notes: 'Opening scene'
    },
    {
      time: 1000,
      duration: 48,
      frame: {
        actors: [{ id: 'char_01' }],
        prompt: 'Hero walks forward'
      }
    }
  ],
  config: {},
  markers: [
    {
      id: 'marker_01',
      time: 500,
      type: 'chapter',
      label: 'Chapter 1',
      color: '#ef4444',
      notes: 'First chapter',
      createdAt: 0,
      updatedAt: 0
    }
  ]
};

const defaultOptions: AafExportOptions = {
  frameRate: 24,
  resolution: '1080p',
  includeAudio: true,
  includeMarkers: true,
  includeMetadata: true
};

describe('generateAaf', () => {
  it('generates valid AAF XML', () => {
    const xml = generateAaf(sampleModel, defaultOptions);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<AAF Version="1.0">');
  });

  it('includes project name', () => {
    const xml = generateAaf(sampleModel, defaultOptions);
    expect(xml).toContain('Test Project');
  });

  it('includes clips for each event', () => {
    const xml = generateAaf(sampleModel, defaultOptions);
    expect(xml).toContain('<SourceClip>');
    expect(xml).toContain('<SourceClip>'); // Two events
  });

  it('includes markers when enabled', () => {
    const xml = generateAaf(sampleModel, { ...defaultOptions, includeMarkers: true });
    expect(xml).toContain('<MarkerLabel>');
    expect(xml).toContain('Chapter 1');
  });

  it('excludes markers when disabled', () => {
    const xml = generateAaf(sampleModel, { ...defaultOptions, includeMarkers: false });
    expect(xml).not.toContain('<MarkerLabel>');
  });

  it('includes metadata when enabled', () => {
    const xml = generateAaf(sampleModel, { ...defaultOptions, includeMetadata: true });
    expect(xml).toContain('<UserComment>');
    expect(xml).toContain('A hero stands');
  });

  it('excludes metadata when disabled', () => {
    const xml = generateAaf(sampleModel, { ...defaultOptions, includeMetadata: false });
    expect(xml).not.toContain('<UserComment>');
  });

  it('includes audio tracks when enabled', () => {
    const xml = generateAaf(sampleModel, { ...defaultOptions, includeAudio: true });
    expect(xml).toContain('Audio 1');
  });

  it('excludes audio tracks when disabled', () => {
    const xml = generateAaf(sampleModel, { ...defaultOptions, includeAudio: false });
    expect(xml).not.toContain('Audio 1');
  });

  it('uses correct resolution for 1080p', () => {
    const xml = generateAaf(sampleModel, { ...defaultOptions, resolution: '1080p' });
    expect(xml).toContain('<VideoWidth>1920</VideoWidth>');
    expect(xml).toContain('<VideoHeight>1080</VideoHeight>');
  });

  it('uses correct resolution for 4K', () => {
    const xml = generateAaf(sampleModel, { ...defaultOptions, resolution: '4K' });
    expect(xml).toContain('<VideoWidth>3840</VideoWidth>');
    expect(xml).toContain('<VideoHeight>2160</VideoHeight>');
  });

  it('uses custom resolution when specified', () => {
    const xml = generateAaf(sampleModel, {
      ...defaultOptions,
      resolution: 'custom',
      customWidth: 2560,
      customHeight: 1440
    });
    expect(xml).toContain('<VideoWidth>2560</VideoWidth>');
    expect(xml).toContain('<VideoHeight>1440</VideoHeight>');
  });

  it('escapes XML special characters', () => {
    const modelWithSpecial: Model = {
      ...sampleModel,
      timeline: [
        {
          time: 0,
          duration: 24,
          frame: {
            prompt: 'Test & "quotes" <tags>',
            actors: []
          },
          notes: "It's a test"
        }
      ]
    };

    const xml = generateAaf(modelWithSpecial, { ...defaultOptions, includeMetadata: true });
    expect(xml).toContain('Test &amp; &quot;quotes&quot; &lt;tags&gt;');
    expect(xml).toContain('It&apos;s a test');
  });
});

describe('downloadAaf', () => {
  it('generates valid XML for download', () => {
    const xml = generateAaf(sampleModel, defaultOptions);
    expect(xml).toContain('<?xml');
    expect(xml.length).toBeGreaterThan(0);
  });
});
