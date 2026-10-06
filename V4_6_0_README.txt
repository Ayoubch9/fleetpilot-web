MileVoxa Web v4.6.0 — Load Decision Center V1

NEW
- /load-decision authenticated page
- Sidebar navigation entry: Load Decision
- Offer analysis: rate, loaded/deadhead miles, fuel price, MPG, operating cost/mile, target RPM
- Results: total miles, gross/all-mile RPM, fuel gallons/cost, estimated contribution, profit/mile, margin, deadhead share
- Good / Marginal / Poor rating with transparent reasons
- Recent recorded fuel purchases prefill fuel-price assumption when available
- Accept & Add Load reuses analyzed rate/mileage and writes through existing loads table/RLS
- Responsive MileVoxa styling and decision-support disclaimer

VERIFY
rmdir /s /q .next
npm install
npm run typecheck
npm run test:action-center
npm run test:load-decision
npm run build
