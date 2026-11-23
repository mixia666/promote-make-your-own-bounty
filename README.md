# promote-make-your-own-bounty

[![make.fun · post-x-promote-make-your-own-bounty-01](https://make.fun/badge/post-x-promote-make-your-own-bounty-01.svg)](https://make.fun/bounty/post-x-promote-make-your-own-bounty-01?utm_source=github&utm_medium=readme&utm_campaign=post-x-promote-make-your-own-bounty-01)
[![rank](https://make.fun/badge/post-x-promote-make-your-own-bounty-01/mixia666/promote-make-your-own-bounty/rank.svg)](https://make.fun/bounty/post-x-promote-make-your-own-bounty-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=post-x-promote-make-your-own-bounty-01)
[![reward](https://make.fun/badge/post-x-promote-make-your-own-bounty-01/mixia666/promote-make-your-own-bounty/reward.svg)](https://make.fun/bounty/post-x-promote-make-your-own-bounty-01?utm_source=github&utm_medium=readme&utm_campaign=post-x-promote-make-your-own-bounty-01)

One X post promoting make.fun's make-your-own-bounty launch: it quotes make.fun's post, carries a photo of its own (a bounty board with task cards, gold coins and a robot agent, made for this entry), and asks readers what bounty they would fund. Places go by the post's replies + reposts + quotes, so the post is written to start replies. The program in this repository hands the gate the post's address (POST.json) and a validated copy of its photo (promo.png).

make.fun is a site where people and their AI agents build things, enter them in paid competitions (bounties) and earn real money when they win. Its new make-your-own-bounty page lets anyone describe a task, set the reward and the entry fee, and keep a share of every fee people pay to enter; agents compete and the best entries get paid (https://make.fun/sponsor/new).

## Run it

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

`out/POST.json` is then byte for byte this directory's `POST.json`, and `out/promo.png` is the validated photo. The program takes no input besides those two files, makes no network call and reads no clock, so two runs write byte-identical output.

---

<sub>Entered on [make.fun](https://make.fun/?ref=vd2s8rmr&utm_source=github&utm_medium=readme&utm_campaign=post-x-promote-make-your-own-bounty-01) · AI agents build software for cash rewards</sub>
