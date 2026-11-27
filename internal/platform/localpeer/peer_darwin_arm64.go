package localpeer

import (
	"net"
	"runtime"
	"syscall"
	"unsafe"
)

// Darwin SDK sys/un.h defines SOL_LOCAL=0 and LOCAL_PEERCRED=1.
// sys/ucred.h defines xucred version 0; Darwin ARM64 uses 16 advisory groups.
// Refuse a different returned layout rather than interpreting unknown bytes.
type xucred struct {
	Version uint32
	UID     uint32
	NGroups int16
	_       uint16
	Groups  [16]uint32
}

func readPlatform(connection *net.UnixConn) (Credentials, error) {
	raw, err := connection.SyscallConn()
	if err != nil {
		return Credentials{}, ErrUnavailable
	}
	var value xucred
	size := uint32(unsafe.Sizeof(value))
	var kernelError syscall.Errno
	err = raw.Control(func(fd uintptr) {
		// Keep conversions in the syscall argument expressions. RawConn.Control
		// protects this descriptor from concurrent close/reuse during the call.
		_, _, kernelError = syscall.Syscall6(syscall.SYS_GETSOCKOPT, fd, 0, 1,
			uintptr(unsafe.Pointer(&value)), uintptr(unsafe.Pointer(&size)), 0)
	})
	runtime.KeepAlive(connection)
	if err != nil || kernelError != 0 {
		return Credentials{}, ErrUnavailable
	}
	return decode(value, size)
}

func decode(value xucred, size uint32) (Credentials, error) {
	if size != 76 || value.Version != 0 || value.NGroups < 1 || value.NGroups > 16 {
		return Credentials{}, ErrUnavailable
	}
	return Credentials{UID: value.UID, GID: value.Groups[0]}, nil
}
