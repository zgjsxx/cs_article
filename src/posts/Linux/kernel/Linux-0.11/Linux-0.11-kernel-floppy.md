---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录floppy.c详解](#linux-011-kernel目录floppyc详解)
  - [floppy\_deselect](#floppy_deselect)
  - [floppy\_change](#floppy_change)
  - [setup\_DMA](#setup_dma)
  - [output\_byte](#output_byte)
  - [result](#result)
  - [bad\_flp\_intr](#bad_flp_intr)
  - [rw\_interrupt](#rw_interrupt)
  - [setup\_rw\_floppy](#setup_rw_floppy)
  - [seek\_interrupt](#seek_interrupt)
  - [transfer](#transfer)
  - [recal\_interrupt](#recal_interrupt)
  - [unexpected\_floppy\_interrupt](#unexpected_floppy_interrupt)
  - [recalibrate\_floppy](#recalibrate_floppy)
  - [reset\_interrupt](#reset_interrupt)
  - [reset\_floppy](#reset_floppy)
  - [floppy\_on\_interrupt](#floppy_on_interrupt)
  - [do\_fd\_request](#do_fd_request)
  - [floppy\_init](#floppy_init)

# Linux-0.11 kernel目录floppy.c详解

## floppy_deselect

## floppy_change

## setup_DMA

## output_byte

## result

## bad_flp_intr

## rw_interrupt

## setup_rw_floppy

## seek_interrupt

## transfer

## recal_interrupt

## unexpected_floppy_interrupt

## recalibrate_floppy

## reset_interrupt

## reset_floppy

## floppy_on_interrupt

## do_fd_request

## floppy_init