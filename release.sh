#!/bin/bash


pnpm build
pnpm changeset
pnpm changeset version
pnpm changeset publish --no-git-checks


