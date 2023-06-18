#!/bin/bash

C_RESET='\033[0m'
C_YELLOW='\033[0;33m'
B_C_YELLOW='\033[1;33m'
C_BLUE='\033[0;34m'
C_RED='\033[0;31m'
C_GREEN='\033[0;32m'

function println() {
  echo -e "$1"
}

function infoln() {
  println "${C_BLUE}${1}${C_RESET}"
}

# successln echos in green color
function successln() {
  println "${C_GREEN}${1}${C_RESET}"
}

function warnBoldln() {
  println "${B_C_YELLOW}${1}${C_RESET}"
}

function warnln() {
  println "${C_YELLOW}${1}${C_RESET}"
}

# errorln echos i red color
function errorln() {
  println "${C_RED}${1}${C_RESET}"
}

# fatalln echos in red color and exits with fail status
function fatalln() {
  errorln "$1"
  exit 1
}

function verifyResult() {
  if [ $1 -ne 0 ]; then
    fatalln "$2"
  fi
}