import { describe, it, expect } from 'vitest';
import { generateFcpxXml, downloadFcpxXml } from '$lib/utils/fcpx-export';
import type { Model } from '$lib/model/model-types';

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

describe('generateFcpxXml', () => {
  it('generates valid FCPX XML', () => {
    const xml = generateFcpxXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<fcpxml version="1.10">');
  });

  it('includes project name', () => {
    const xml = generateFcpxXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('Test Project');
  });

  it('includes clips for each event', () => {
    const xml = generateFcpxXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('<clip name=');
  });

  it('includes markers when enabled', () => {
    const xml = generateFcpxXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('<marker');
    expect(xml).toContain('Chapter 1');
  });

  it('excludes markers when disabled', () => {
    const xml = generateFcpxXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: false
    });
    expect(xml).not.toContain('<marker');
  });

  it('includes notes when present', () => {
    const xml = generateFcpxXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('<notes>');
    expect(xml).toContain('Opening scene');
  });

  it('includes audio references when enabled', () => {
    const xml = generateFcpxXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('<audio>');
  });

  it('excludes audio when disabled', () => {
    const xml = generateFcpxXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: false,
      includeMarkers: true
    });
    expect(xml).not.toContain('<audio>');
  });

  it('uses correct resolution for 1080p', () => {
    const xml = generateFcpxXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('width="1920"');
    expect(xml).toContain('height="1080"');
  });

  it('uses correct resolution for 4K', () => {
    const xml = generateFcpxXml(sampleModel, {
      frameRate: 24,
      resolution: '4K',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('width="3840"');
    expect(xml).toContain('height="2160"');
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

    const xml = generateFcpxXml(modelWithSpecial, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('Test &amp; &quot;quotes&quot; &lt;tags&gt;');
    expect(xml).toContain('It&apos;s a test');
  });
});

describe('downloadFcpxXml', () => {
  it('generates valid XML for download', () => {
    const xml = generateFcpxXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('<?xml');
    expect(xml.length).toBeGreaterThan(0);
  });
});
