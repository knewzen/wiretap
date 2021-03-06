import initializeWalkieTalkie, {
  emitChange,
  emitAction,
  emitSnapshot,
  emitPatch,
  emitRecodingStart,
  emitRecodingEnd
} from "./walkieTalkie";
import globalState from "./globalTrackingState";
import {
  recordActions,
  onSnapshot,
  onPatch,
  onAction,
  applySnapshot,
  applyPatch
} from "mobx-state-tree";
import { isAction } from "mobx";

export function inspect(name, thingToTrack, providedActions) {
  const id = globalState.addObservable(thingToTrack);
  const actions = providedActions || getActions(thingToTrack);

  emitChange({
    id,
    name,
    value: thingToTrack.toJSON(),
    actions,
    isStateTree: true
  });

  onSnapshot(thingToTrack, snapshot => {
    emitSnapshot({
      id,
      value: thingToTrack.toJSON(),
      snapshot
    });
  });

  onAction(thingToTrack, change => {
    emitAction({
      id,
      value: thingToTrack.toJSON(),
      action: change
    });
  });

  onPatch(thingToTrack, change => {
    emitPatch({
      id,
      value: thingToTrack.toJSON(),
      patch: change
    });
  });
}

export function startRecording(id) {
  const observableToRecord = globalState.getObservable(id);
  const recordingId = globalState.addRecorder(
    id,
    recordActions(observableToRecord)
  );
  emitRecodingStart({
    id,
    recordingId
  });
}

export function stopRecording(id, recordingId) {
  const recorder = globalState.getRecorder(id, recordingId);
  recorder.stop();
  emitRecodingEnd({ id, recordingId });
}

export function playRecording(id, recordingId) {
  const recorder = globalState.getRecorder(id, recordingId);
  recorder.replay(globalState.getObservable(id));
}

/**
 * Applies a snapshot to the observerble represented by the trackerId
 * @param {*} payload
 */
export function handleSnapshotUpdate({ trackerId, value }) {
  let observableThing = globalState.getObservable(trackerId);
  applySnapshot(observableThing, value);
}

export function handlePatchUpdate({ trackerId, value }) {
  let observableThing = globalState.getObservable(trackerId);
  applyPatch(observableThing, value);
}

function getActions(thingToTrack) {
  return Object.getOwnPropertyNames(thingToTrack).filter(item =>
    isAction(thingToTrack[item])
  );
}
