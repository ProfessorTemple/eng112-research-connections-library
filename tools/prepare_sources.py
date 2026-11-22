#!/usr/bin/env python3
"""Validate and prepare the external Research Connections Library data file."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
p=root/'data'/'sources.json'
raw=json.loads(p.read_text(encoding='utf-8'))
assert isinstance(raw.get('sources'),list) and raw['sources'], 'No source records found'
seen=set()
for i,s in enumerate(raw['sources'],start=1):
    for key in ('id','title','author','collection','kind','topics','featured'):
        assert key in s, f'Record {i} missing {key}'
    assert isinstance(s['id'],str) and s['id'].strip() and s['id'] not in seen, f'Duplicate or invalid ID: {s["id"]}'
    seen.add(s['id'])
    url=s.get('url','')
    assert not url or (isinstance(url,str) and url.startswith('https://')), f'Invalid public URL for {s["id"]}'
raw['count']=len(raw['sources'])
raw['pilot_count']=sum(bool(s['featured']) for s in raw['sources'])
assert isinstance(raw.get('connections'),list)
for pair in raw['connections']:
    assert len(pair)==4, 'Connection should have two IDs, a title, and a note'
    for nr in pair[:2]:
        assert f'ENG112-{str(nr).zfill(3)}' in seen, f'Broken connection ID: {nr}'
p.write_text(json.dumps(raw,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
js='/* Generated from sources.json. Do not edit directly. */\nwindow.RAE_SOURCE_DATA = '+json.dumps(raw,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
(root/'data'/'sources.js').write_text(js,encoding='utf-8')
print(f'VALID: {raw["count"]} source records, {raw["pilot_count"]} curated readings, {len(raw["connections"])} connections')
