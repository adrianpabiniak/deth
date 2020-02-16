// eslint-disable-next-line
import { InterpreterStep } from 'ethereumjs-vm/dist/evm/interpreter'
import { bufferToHex } from 'ethereumjs-util'
import { bufferToAddress } from '../primitives'
import { CliLogger } from './CliLogger'

export const eventLogger = (cliLogger: CliLogger) => (runState: InterpreterStep) => {
  const opcodeName = runState.opcode.name
  if (!opcodeName.startsWith('LOG')) {
    return
  }

  // is there a better way to get topic count?
  const topicsCount = parseInt(opcodeName.substr(3))
  const [memOffset, memLength, ...topicsRaw] = getLastN(runState.stack, 2 + topicsCount)

  const topics = topicsRaw
    .map(function (a) {
      return a.toArrayLike(Buffer, 'be', 32)
    })
    .map(bufferToHex)
  const data = bufferToHex(
    memLength.isZero()
      ? Buffer.alloc(32)
      : getMemoryAsBuffer(runState.memory, memOffset.toNumber(), memLength.toNumber()),
  )

  cliLogger.logEvent(data, topics)
}

export const revertLogger = (cliLogger: CliLogger) => (runState: InterpreterStep) => {
  const opcodeName = runState.opcode.name
  if (opcodeName !== 'REVERT') {
    return
  }

  const [offset, length] = getLastN(runState.stack, 2)
  const rawDataBuffer = getMemoryAsBuffer(runState.memory, offset.toNumber(), length.toNumber())
  // dunno why there is a garbage printed out apart from revert string
  const reason = rawDataBuffer.toString('utf8') || '(unknown)'

  cliLogger.logRevert(reason, bufferToAddress(runState.address))
}

function getLastN<T> (arr: T[], n: number): T[] {
  return arr.slice(-n).reverse()
}

function getMemoryAsBuffer (memory: number[], offset: number, length: number) {
  const rawData = memory.slice(offset, offset + length)
  return Buffer.from(rawData)
}